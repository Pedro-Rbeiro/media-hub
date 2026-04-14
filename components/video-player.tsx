"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { 
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, CheckCircle, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { saveProgress, getProgress, markAsWatched, formatTime, clearProgress } from "@/lib/media-store"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  videoUrl: string
  videoPath: string
  videoName: string
  onClose: () => void
}

export function VideoPlayer({ videoUrl, videoPath, videoName, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isWatched, setIsWatched] = useState(false)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedTime, setSavedTime] = useState(0)

  // Load saved progress on mount
  useEffect(() => {
    const progress = getProgress(videoPath)
    if (progress && progress.currentTime > 10 && !progress.watched) {
      setSavedTime(progress.currentTime)
      setShowResumePrompt(true)
    }
    if (progress?.watched) {
      setIsWatched(true)
    }
  }, [videoPath])

  // Save progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && duration > 0) {
        saveProgress(videoPath, videoRef.current.currentTime, duration)
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [videoPath, duration])

  // Fallback: tenta obter duração periodicamente se ainda não tiver
  useEffect(() => {
    if (duration > 0) return
    
    const checkDuration = setInterval(() => {
      if (videoRef.current && videoRef.current.duration && isFinite(videoRef.current.duration)) {
        console.log("[v0] interval fallback - duration:", videoRef.current.duration)
        setDuration(videoRef.current.duration)
        clearInterval(checkDuration)
      }
    }, 1000)
    
    return () => clearInterval(checkDuration)
  }, [duration])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(v => Math.min(1, v + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(v => Math.max(0, v - 0.1))
          break
        case 'm':
          e.preventDefault()
          setIsMuted(m => !m)
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (!isFullscreen) {
            onClose()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, onClose])

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
    }
  }, [isPlaying])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
      // Tentar obter duração após play (fallback para TVs)
      setTimeout(() => {
        if (videoRef.current && videoRef.current.duration && isFinite(videoRef.current.duration) && duration === 0) {
          console.log("[v0] togglePlay fallback - duration:", videoRef.current.duration)
          setDuration(videoRef.current.duration)
        }
      }, 500)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const skip = (seconds: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime += seconds
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
    
    // Check if video is almost complete
    const percentWatched = (videoRef.current.currentTime / duration) * 100
    if (percentWatched >= 90 && !isWatched) {
      markAsWatched(videoPath)
      setIsWatched(true)
    }
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    console.log("[v0] loadedmetadata - duration:", videoRef.current.duration)
    console.log("[v0] loadedmetadata - readyState:", videoRef.current.readyState)
    if (videoRef.current.duration && isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleDurationChange = () => {
    if (!videoRef.current) return
    console.log("[v0] durationchange - duration:", videoRef.current.duration)
    if (videoRef.current.duration && isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleCanPlay = () => {
    if (!videoRef.current) return
    console.log("[v0] canplay - duration:", videoRef.current.duration)
    console.log("[v0] canplay - readyState:", videoRef.current.readyState)
    if (videoRef.current.duration && isFinite(videoRef.current.duration) && duration === 0) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    console.log("[v0] video error:", video.error?.message, video.error?.code)
  }

  const handleProgress = () => {
    if (!videoRef.current) return
    // Try to get duration from buffered ranges as fallback
    if (duration === 0 && videoRef.current.buffered.length > 0) {
      console.log("[v0] progress - buffered end:", videoRef.current.buffered.end(videoRef.current.buffered.length - 1))
    }
    if (videoRef.current.duration && isFinite(videoRef.current.duration) && duration === 0) {
      console.log("[v0] progress - found duration:", videoRef.current.duration)
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return
    const newVolume = value[0]
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const handleResume = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = savedTime
    }
    setShowResumePrompt(false)
  }

  const handleStartOver = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
    clearProgress(videoPath)
    setIsWatched(false)
    setShowResumePrompt(false)
  }

  const handleMarkWatched = () => {
    markAsWatched(videoPath)
    setIsWatched(true)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onMouseMove={showControlsTemporarily}
      onClick={showControlsTemporarily}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="h-full w-full object-contain"
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleDurationChange}
        onCanPlay={handleCanPlay}
        onProgress={handleProgress}
        onError={handleError}
        onLoadedData={() => {
          // Fallback para TVs que não disparam loadedmetadata corretamente
          if (videoRef.current && videoRef.current.duration && isFinite(videoRef.current.duration) && duration === 0) {
            console.log("[v0] loadeddata - duration:", videoRef.current.duration)
            setDuration(videoRef.current.duration)
          }
        }}
        onEnded={() => {
          setIsPlaying(false)
          markAsWatched(videoPath)
          setIsWatched(true)
        }}
        onClick={togglePlay}
      />

      {/* Resume Prompt */}
      {showResumePrompt && (
        <div 
          className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="flex flex-col items-center gap-6 rounded-2xl bg-card p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold">Continuar de onde parou?</h3>
            <p className="text-muted-foreground">
              Você parou em {formatTime(savedTime)}
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartOver()
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Recomeçar
              </Button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleResume()
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 flex flex-col justify-between transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-white lg:text-xl">
                {videoName.replace(/\.[^/.]+$/, '')}
              </h2>
            </div>
          </div>
          
          {isWatched && (
            <div className="flex items-center gap-2 rounded-full bg-success/20 px-3 py-1.5 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Assistido</span>
            </div>
          )}
        </div>

        {/* Center Play Button */}
        <div className="flex items-center justify-center">
          {!isPlaying && !showResumePrompt && (
            <Button
              size="lg"
              className="h-20 w-20 rounded-full bg-primary/90 hover:bg-primary lg:h-24 lg:w-24"
              onClick={togglePlay}
            >
              <Play className="h-10 w-10 lg:h-12 lg:w-12" fill="currentColor" />
            </Button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="space-y-4 bg-gradient-to-t from-black/80 to-transparent p-4 lg:p-6">
          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <span className="w-16 text-sm text-white/80 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1 cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-primary [&_.bg-primary]:bg-primary"
            />
            <span className="w-16 text-right text-sm text-white/80 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:bg-white/20">
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={togglePlay}
                className="h-12 w-12 text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" fill="currentColor" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:bg-white/20">
                <SkipForward className="h-5 w-5" />
              </Button>
              
              <div className="ml-4 flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMuted(m => !m)}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24 cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-white [&_.bg-primary]:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isWatched && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleMarkWatched}
                  className="text-white hover:bg-white/20"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como visto
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
