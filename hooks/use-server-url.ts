"use client"

import { useState, useEffect, useCallback } from "react"

const DEFAULT_SERVER_URL = "http://192.168.0.67:80"
const STORAGE_KEY_SERVER = "media-center-server-url"

export function useServerUrl() {
  const [serverUrl, setServerUrlState] = useState(DEFAULT_SERVER_URL)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER)
    if (saved) setServerUrlState(saved)
  }, [])

  const setServerUrl = useCallback((url: string) => {
    const cleanUrl = url.replace(/\/+$/, "")
    setServerUrlState(cleanUrl)
    localStorage.setItem(STORAGE_KEY_SERVER, cleanUrl)
  }, [])

  return { serverUrl, setServerUrl }
}
