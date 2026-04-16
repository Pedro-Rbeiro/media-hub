"use client"

import { useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { VideoPlayer } from "@/components/video-player"
import { useServerUrl } from "@/hooks/use-server-url"
import {
  browseHref,
  normalizedSegments,
  segmentsToFilePath,
  encodeServerPathSegments,
} from "@/lib/media-routes"

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const { serverUrl } = useServerUrl()

  const segments = useMemo(
    () => normalizedSegments(params.path as string | string[] | undefined),
    [params.path]
  )
  console.log("🚀 ~ WatchPage ~ segments:", segments)
  const videoPath = segmentsToFilePath(segments)
  const videoName = segments.length > 0 ? segments[segments.length - 1] : ""

  useEffect(() => {
    if (segments.length === 0) {
      router.replace("/browse")
    }
  }, [segments.length, router])

  const handleClose = () => {
    router.push(browseHref(segments.slice(0, -1)))
  }

  if (segments.length === 0) {
    return null
  }

  const videoUrl = `${serverUrl.replace(/\/+$/, "")}/${segments.join("/")}`

  return (
    <VideoPlayer
      videoUrl={videoUrl}
      videoPath={videoPath}
      videoName={videoName}
      onClose={handleClose}
    />
  )
}
