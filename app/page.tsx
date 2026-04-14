"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { FileGrid } from "@/components/file-grid"
import { VideoPlayer } from "@/components/video-player"
import { FileItem } from "@/lib/types"
import { Loader2, AlertCircle, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

const DEFAULT_SERVER_URL = "http://192.168.0.250:80"
const STORAGE_KEY_SERVER = "media-center-server-url"

export default function MediaCenter() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL)
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentVideo, setCurrentVideo] = useState<FileItem | null>(null)

  // Load saved server URL
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER)
    if (saved) {
      setServerUrl(saved)
    }
  }, [])

  // Save server URL when changed
  const handleServerChange = (url: string) => {
    // Ensure URL doesn't end with slash
    const cleanUrl = url.replace(/\/+$/, '')
    setServerUrl(cleanUrl)
    localStorage.setItem(STORAGE_KEY_SERVER, cleanUrl)
    setCurrentPath([])
  }

  const fetchDirectory = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const pathStr = currentPath.join('/')
      const url = pathStr ? `${serverUrl}/${pathStr}/` : `${serverUrl}/`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const html = await response.text()
      const parsed = parseNginxDirectory(html, pathStr)
      setItems(parsed)
    } catch (err) {
      console.error('[v0] Error fetching directory:', err)
      setError(
        err instanceof TypeError 
          ? 'Não foi possível conectar ao servidor. Verifique se o servidor está ligado e acessível.'
          : `Erro ao carregar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
      )
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [serverUrl, currentPath])

  useEffect(() => {
    fetchDirectory()
  }, [fetchDirectory])

  const parseNginxDirectory = (html: string, basePath: string): FileItem[] => {
    const items: FileItem[] = []
    
    // Parse NGINX autoindex HTML
    // Match patterns like: <a href="filename">filename</a> or <a href="folder/">folder/</a>
    const linkRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    let match
    
    while ((match = linkRegex.exec(html)) !== null) {
      const href = decodeURIComponent(match[1])
      const name = decodeURIComponent(match[2])
      
      // Skip parent directory links
      if (href === '../' || name === '../' || name === 'Parent Directory') {
        continue
      }
      
      const isDirectory = href.endsWith('/')
      const cleanName = name.replace(/\/$/, '')
      const cleanHref = href.replace(/\/$/, '')
      
      // Skip hidden files
      if (cleanName.startsWith('.')) {
        continue
      }

      items.push({
        name: cleanName,
        path: basePath ? `${basePath}/${cleanHref}` : cleanHref,
        type: isDirectory ? 'directory' : 'file',
      })
    }
    
    return items
  }

  const handleNavigate = (item: FileItem) => {
    if (item.type === 'directory') {
      setCurrentPath(item.path.split('/').filter(Boolean))
    }
  }

  const handleNavigatePath = (path: string[]) => {
    setCurrentPath(path)
  }

  const handlePlayVideo = (item: FileItem) => {
    setCurrentVideo(item)
  }

  const getVideoUrl = (item: FileItem) => {
    return `${serverUrl}/${item.path}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        serverUrl={serverUrl}
        onServerChange={handleServerChange}
        currentPath={currentPath}
        onNavigate={handleNavigatePath}
      />
      
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Status Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold lg:text-3xl">
              {currentPath.length > 0 ? currentPath[currentPath.length - 1] : 'Biblioteca'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? 'Carregando...' : `${items.length} itens`}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchDirectory}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando conteúdo...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              {error.includes('conectar') ? (
                <WifiOff className="h-12 w-12 text-destructive" />
              ) : (
                <AlertCircle className="h-12 w-12 text-destructive" />
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold">Erro de Conexão</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
            <div className="mt-6 flex gap-4">
              <Button variant="outline" onClick={fetchDirectory}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button 
                variant="default"
                onClick={() => {
                  const settingsBtn = document.querySelector('[data-settings-trigger]') as HTMLButtonElement
                  settingsBtn?.click()
                }}
              >
                Configurar Servidor
              </Button>
            </div>
          </div>
        ) : (
          <FileGrid 
            items={items}
            onNavigate={handleNavigate}
            onPlayVideo={handlePlayVideo}
          />
        )}
      </main>

      {/* Video Player Modal */}
      {currentVideo && (
        <VideoPlayer
          videoUrl={getVideoUrl(currentVideo)}
          videoPath={currentVideo.path}
          videoName={currentVideo.name}
          onClose={() => setCurrentVideo(null)}
        />
      )}
    </div>
  )
}
