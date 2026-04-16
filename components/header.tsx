"use client"

import Link from "next/link"
import { Play, Settings, Home, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { browseHref } from "@/lib/media-routes"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface HeaderProps {
  serverUrl: string
  onServerChange: (url: string) => void
  currentPath: string[]
}

export function Header({ serverUrl, onServerChange, currentPath }: HeaderProps) {
  const [tempUrl, setTempUrl] = useState(serverUrl)
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    onServerChange(tempUrl)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Play className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight">MediaHub</span>
        </div>

        <nav className="flex flex-1 items-center gap-2 overflow-x-auto px-4">
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link href={browseHref([])} title="Biblioteca">
              <Home className="h-4 w-4" />
            </Link>
          </Button>

          {currentPath.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <Button variant="ghost" size="sm" className="shrink-0 max-w-[200px] truncate" asChild>
                <Link href={browseHref(currentPath.slice(0, index + 1))}>
                  {segment}
                </Link>
              </Button>
            </div>
          ))}
        </nav>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              data-settings-trigger
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configurações do Servidor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL do Servidor NGINX</label>
                <Input
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://192.168.0.250:80"
                />
                <p className="text-xs text-muted-foreground">
                  Insira o endereço completo do seu servidor de mídia
                </p>
              </div>
              <Button onClick={handleSave} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
