"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope)
        })
        .catch((error) => {
          console.log("SW registration failed:", error)
        })
    }

    // Capture install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      
      // Check if user hasn't dismissed before
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      if (!dismissed) {
        setShowInstallBanner(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === "accepted") {
      setShowInstallBanner(false)
    }
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!showInstallBanner) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-6 py-4 shadow-2xl">
        <div className="flex-1">
          <h4 className="font-semibold">Instalar MediaHub</h4>
          <p className="text-sm text-muted-foreground">
            Instale o app para acesso rápido na sua TV
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
          <Button onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Instalar
          </Button>
        </div>
      </div>
    </div>
  )
}
