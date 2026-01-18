import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// 환경 변수 확인
const hasRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN

const isProduction = process.env.NODE_ENV === 'production'

// Redis 클라이언트 초기화 (환경 변수 있을 때만)
let redis: Redis | null = null

if (hasRedisConfig) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  } catch (error) {
    console.error('Redis 초기화 실패:', error)
    redis = null
  }
}

// 인메모리 Rate Limiter (개발 환경용)
// 주의: 서버 재시작 시 초기화됨, 분산 환경에서는 작동하지 않음
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(ms|s|m|h|d)$/)
  if (!match) return 60000 // 기본 1분

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 'ms': return value
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return 60000
  }
}

function createInMemoryLimiter(maxRequests: number, windowMs: number, prefix: string) {
  return {
    limit: async (identifier: string) => {
      const key = `${prefix}:${identifier}`
      const now = Date.now()
      const entry = memoryStore.get(key)

      // 기존 엔트리가 없거나 윈도우 만료됨
      if (!entry || now >= entry.resetAt) {
        const resetAt = now + windowMs
        memoryStore.set(key, { count: 1, resetAt })
        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - 1,
          reset: resetAt,
          pending: Promise.resolve(),
        }
      }

      // 아직 윈도우 내
      if (entry.count < maxRequests) {
        entry.count++
        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - entry.count,
          reset: entry.resetAt,
          pending: Promise.resolve(),
        }
      }

      // 제한 초과
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: entry.resetAt,
        pending: Promise.resolve(),
      }
    },
  }
}

// 메모리 정리 (오래된 엔트리 제거) - 5분마다
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (now >= entry.resetAt) {
        memoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// Rate Limiter 생성 헬퍼
function createRateLimiter(limit: number, window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`, prefix: string) {
  if (!redis) {
    if (isProduction) {
      // 프로덕션에서 Redis 없으면 모든 요청 차단
      console.error(`[Rate Limiter] 프로덕션 환경에서 Redis 미설정 - ${prefix} 모든 요청 차단`)
      return {
        limit: async (_identifier: string) => ({
          success: false,
          limit: 0,
          remaining: 0,
          reset: Date.now() + 60000,
          pending: Promise.resolve(),
        }),
      }
    }

    // 개발 환경에서는 인메모리 fallback
    console.warn(`[Rate Limiter] 개발 환경 - ${prefix} 인메모리 제한 사용`)
    return createInMemoryLimiter(limit, parseWindow(window), prefix)
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix,
  })
}

// Rate Limiter 인스턴스들
export const commentLimiter = createRateLimiter(5, '1 m', 'ratelimit:comment')
export const voteLimiter = createRateLimiter(3, '1 m', 'ratelimit:vote')
export const adminAuthLimiter = createRateLimiter(5, '1 m', 'ratelimit:admin-auth')
export const curiousLimiter = createRateLimiter(3, '1 m', 'ratelimit:curious')
export const chatSendLimiter = createRateLimiter(5, '5 s', 'ratelimit:chat:send')
export const chatJoinLimiter = createRateLimiter(3, '1 m', 'ratelimit:chat:join')
export const chatPresenceLimiter = createRateLimiter(6, '10 s', 'ratelimit:chat:presence')
export const reportLimiter = createRateLimiter(5, '5 m', 'ratelimit:report') // 신고 남용 방지: 5분에 5회

// IP 주소 추출 헬퍼 함수
export function getClientIp(request: Request): string {
  // Vercel 환경에서 IP 추출
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // 로컬 개발 환경
  return '127.0.0.1'
}