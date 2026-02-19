/// <reference lib="webworker" />

const CACHE_VERSION = "v1"
const STATIC_CACHE = `static-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`

const OFFLINE_URL = "/offline"

const STATIC_ASSETS = [OFFLINE_URL, "/icons/android-chrome-192x192.png", "/icons/android-chrome-512x512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE && k !== IMAGE_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET") return

  // Product images: cache-first (they rarely change)
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg)$/i) || url.hostname.includes("continente") || url.hostname.includes("auchan") || url.hostname.includes("pingodoce")) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 60 * 60 * 24 * 7))
    return
  }

  // Static assets (JS, CSS, fonts): stale-while-revalidate
  if (url.pathname.match(/\.(js|css|woff2?)$/i) || url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }

  // API requests: network-first with short cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, 5000))
    return
  }

  // HTML navigation: network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || new Response("Offline", { status: 503 }))),
    )
    return
  }
})

async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request)
  if (cached) {
    const dateHeader = cached.headers.get("sw-cached-at")
    if (dateHeader) {
      const age = (Date.now() - Number(dateHeader)) / 1000
      if (age < maxAgeSeconds) return cached
    } else {
      return cached
    }
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      const headers = new Headers(clone.headers)
      headers.set("sw-cached-at", String(Date.now()))
      const body = await clone.blob()
      const cachedResponse = new Response(body, { status: clone.status, statusText: clone.statusText, headers })
      const cache = await caches.open(cacheName)
      cache.put(request, cachedResponse)
    }
    return response
  } catch {
    return cached || new Response("", { status: 408 })
  }
}

async function networkFirst(request, cacheName, timeoutMs) {
  try {
    const response = await Promise.race([fetch(request), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs))])
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)

  return cached || fetchPromise
}
