"use client"

import { Folder, Film, FileText, CheckCircle, Clock, Play } from "lucide-react"
import { FileItem, isVideoFile, formatFileSize } from "@/lib/types"
import { getProgress, formatTime, VideoProgress } from "@/lib/media-store"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface FileGridProps {
  items: FileItem[]
  onNavigate: (item: FileItem) => void
  onPlayVideo: (item: FileItem) => void
}

function FileCard({ item, progress, onNavigate, onPlayVideo }: { 
  item: FileItem
  progress: VideoProgress | null
  onNavigate: (item: FileItem) => void
  onPlayVideo: (item: FileItem) => void
}) {
  const isVideo = item.type === 'file' && isVideoFile(item.name)
  const isFolder = item.type === 'directory'
  
  const handleClick = () => {
    if (isFolder) {
      onNavigate(item)
    } else if (isVideo) {
      onPlayVideo(item)
    }
  }

  const progressPercent = progress && progress.duration > 0
    ? (progress.currentTime / progress.duration) * 100
    : 0

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col items-center rounded-2xl border border-border/50 bg-card p-4 transition-all duration-300",
        "hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        "lg:p-6"
      )}
    >
      {/* Icon Container */}
      <div className={cn(
        "relative flex h-20 w-20 items-center justify-center rounded-xl transition-all duration-300 lg:h-28 lg:w-28",
        isFolder && "bg-primary/10 text-primary group-hover:bg-primary/20",
        isVideo && "bg-accent/10 text-accent group-hover:bg-accent/20",
        !isFolder && !isVideo && "bg-muted text-muted-foreground"
      )}>
        {isFolder && <Folder className="h-10 w-10 lg:h-14 lg:w-14" />}
        {isVideo && (
          <>
            <Film className="h-10 w-10 lg:h-14 lg:w-14" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-5 w-5" fill="currentColor" />
              </div>
            </div>
          </>
        )}
        {!isFolder && !isVideo && <FileText className="h-10 w-10 lg:h-14 lg:w-14" />}
        
        {/* Watched Badge */}
        {progress?.watched && (
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
            <CheckCircle className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* File Name */}
      <p className="mt-3 w-full text-center text-sm font-medium leading-tight line-clamp-2 lg:text-base lg:mt-4">
        {item.name.replace(/\.[^/.]+$/, '')}
      </p>

      {/* File Info */}
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {item.size && <span>{formatFileSize(item.size)}</span>}
        {isFolder && <span>Pasta</span>}
      </div>

      {/* Progress Bar */}
      {isVideo && progress && progressPercent > 0 && !progress.watched && (
        <div className="mt-3 w-full space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTime(progress.currentTime)}</span>
          </div>
        </div>
      )}
    </button>
  )
}

export function FileGrid({ items, onNavigate, onPlayVideo }: FileGridProps) {
  const [progressMap, setProgressMap] = useState<Record<string, VideoProgress | null>>({})

  useEffect(() => {
    const map: Record<string, VideoProgress | null> = {}
    items.forEach(item => {
      if (item.type === 'file' && isVideoFile(item.name)) {
        map[item.path] = getProgress(item.path)
      }
    })
    setProgressMap(map)
  }, [items])

  // Sort: folders first, then videos, then other files
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1
    if (a.type !== 'directory' && b.type === 'directory') return 1
    
    const aIsVideo = isVideoFile(a.name)
    const bIsVideo = isVideoFile(b.name)
    if (aIsVideo && !bIsVideo) return -1
    if (!aIsVideo && bIsVideo) return 1
    
    return a.name.localeCompare(b.name)
  })

  // Filter out non-video files (keep folders and videos only)
  const filteredItems = sortedItems.filter(item => 
    item.type === 'directory' || isVideoFile(item.name)
  )

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Film className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Nenhum conteúdo encontrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta pasta não contém vídeos ou subpastas
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-6 lg:p-6">
      {filteredItems.map((item) => (
        <FileCard
          key={item.path}
          item={item}
          progress={progressMap[item.path] || null}
          onNavigate={onNavigate}
          onPlayVideo={onPlayVideo}
        />
      ))}
    </div>
  )
}
