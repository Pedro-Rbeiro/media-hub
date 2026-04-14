export interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: string
}

export interface ServerConfig {
  baseUrl: string
}

export const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.wmv', '.flv', '.mpeg', '.mpg']

export function isVideoFile(filename: string): boolean {
  const lower = filename.toLowerCase()
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext))
}

export function getFileIcon(item: FileItem): 'folder' | 'video' | 'file' {
  if (item.type === 'directory') return 'folder'
  if (isVideoFile(item.name)) return 'video'
  return 'file'
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
