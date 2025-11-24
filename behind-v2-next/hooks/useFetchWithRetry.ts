import { useCallback, useRef, useState } from 'react'

interface FetchOptions {
  maxRetries?: number
  timeout?: number // milliseconds
  retryDelay?: number // milliseconds
}

interface FetchState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}

export function useFetchWithRetry<T = unknown>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const fetch = useCallback(
    async (
      url: string,
      options: FetchOptions = {}
    ): Promise<T | null> => {
      const {
        maxRetries = 3,
        timeout = 10000,
        retryDelay = 1000,
      } = options

      setState({ data: null, isLoading: true, error: null })

      let lastError: Error | null = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeout)

          const response = await fetch(url, {
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.status === 401) {
            // 401은 재시도하지 않음 (세션 문제)
            const error = new Error('Unauthorized - please login again')
            setState({ data: null, isLoading: false, error })
            return null
          }

          if (response.ok) {
            const data = await response.json()
            setState({ data, isLoading: false, error: null })
            return data
          }

          // 4xx/5xx 에러는 재시도 대상
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))

          // 마지막 시도가 아니면 재시도
          if (attempt < maxRetries) {
            // timeout 에러의 경우 즉시 재시도, 다른 에러는 delay
            const isTimeoutError =
              lastError.name === 'AbortError' ||
              lastError.message.includes('timeout')
            const delay = isTimeoutError ? 0 : retryDelay

            await new Promise((resolve) => setTimeout(resolve, delay))
            // 재시도 전에 상태 업데이트 (재시도 중임을 표시)
            continue
          }
        }
      }

      // 모든 재시도 실패
      setState({
        data: null,
        isLoading: false,
        error: lastError || new Error('Unknown error'),
      })
      return null
    },
    []
  )

  return {
    ...state,
    fetch,
  }
}
