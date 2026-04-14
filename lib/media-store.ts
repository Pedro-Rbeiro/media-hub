// Store for video progress and watched status

export interface VideoProgress {
  path: string
  currentTime: number
  duration: number
  lastWatched: number
  watched: boolean
}

const STORAGE_KEY = 'media-center-progress'

export function getProgress(videoPath: string): VideoProgress | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  
  const allProgress: Record<string, VideoProgress> = JSON.parse(stored)
  return allProgress[videoPath] || null
}

export function saveProgress(videoPath: string, currentTime: number, duration: number): void {
  if (typeof window === 'undefined') return
  
  const stored = localStorage.getItem(STORAGE_KEY)
  const allProgress: Record<string, VideoProgress> = stored ? JSON.parse(stored) : {}
  
  const percentWatched = (currentTime / duration) * 100
  const watched = percentWatched >= 90
  
  allProgress[videoPath] = {
    path: videoPath,
    currentTime,
    duration,
    lastWatched: Date.now(),
    watched
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
}

export function markAsWatched(videoPath: string): void {
  if (typeof window === 'undefined') return
  
  const stored = localStorage.getItem(STORAGE_KEY)
  const allProgress: Record<string, VideoProgress> = stored ? JSON.parse(stored) : {}
  
  if (allProgress[videoPath]) {
    allProgress[videoPath].watched = true
  } else {
    allProgress[videoPath] = {
      path: videoPath,
      currentTime: 0,
      duration: 0,
      lastWatched: Date.now(),
      watched: true
    }
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
}

export function getAllProgress(): Record<string, VideoProgress> {
  if (typeof window === 'undefined') return {}
  
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : {}
}

export function clearProgress(videoPath: string): void {
  if (typeof window === 'undefined') return
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return
  
  const allProgress: Record<string, VideoProgress> = JSON.parse(stored)
  delete allProgress[videoPath]
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
