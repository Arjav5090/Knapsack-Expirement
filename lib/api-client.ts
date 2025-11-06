/**
 * Optimized API client with caching, request deduplication, and error handling
 */

// Cache for API responses (5 minute TTL)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map<string, Promise<any>>()

// Get API base URL (memoized)
export const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:8787'
  return process.env.NEXT_PUBLIC_API_BASE || 
         (process.env.NODE_ENV === 'production' 
           ? "https://knapsack-expirement.onrender.com"
           : "http://localhost:8787")
}

// Clear cache helper
export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

// Optimized fetch with caching, deduplication, and timeout
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  useCache = false,
  timeout = 10000
): Promise<T> {
  const apiBase = getApiBase()
  const url = `${apiBase}${endpoint}`
  const cacheKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`

  // Check cache first
  if (useCache && options.method === 'GET') {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T
    }
  }

  // Check for pending duplicate request
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>
  }

  // Create request with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const requestPromise = fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
    .then(async (res) => {
      clearTimeout(timeoutId)
      if (!res.ok) {
        const error = await res.json().catch(() => ({ 
          error: `HTTP ${res.status}: Request failed`,
          status: res.status 
        }))
        const errorMessage = new Error(error.error || `HTTP ${res.status}`)
        ;(errorMessage as any).status = res.status
        throw errorMessage
      }
      return res.json()
    })
    .then((data: T) => {
      // Cache successful GET requests
      if (useCache && options.method === 'GET') {
        cache.set(cacheKey, { data, timestamp: Date.now() })
      }
      return data
    })
    .finally(() => {
      pendingRequests.delete(cacheKey)
    })

  // Store pending request
  pendingRequests.set(cacheKey, requestPromise)

  return requestPromise
}

// Specific API methods
export const api = {
  get: <T = any>(endpoint: string, useCache = true) =>
    apiFetch<T>(endpoint, { method: 'GET' }, useCache),
  
  post: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, false),
  
  checkParticipant: (prolificPid: string) =>
    api.get<{ exists: boolean; completed: boolean; participantId?: string }>(
      `/api/v1/check-participant/${prolificPid}`,
      true // Cache participant checks for 5 minutes
    ),
  
  registerProlific: (prolificPid: string, studyId: string, sessionId: string) =>
    api.post<{ participantId: string }>('/api/v1/register-prolific', {
      prolificPid,
      studyId,
      sessionId,
    }),
}

