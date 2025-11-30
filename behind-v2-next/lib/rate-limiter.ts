import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Redis 환경 변수 확인
const hasRedisConfig = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN

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

// Rate Limiter 생성 헬퍼
function createRateLimiter(limit: number, window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`, prefix: string) {
  if (!redis) {
    // Redis 없으면 항상 허용하는 Mock Limiter 반환
    console.warn(`[Rate Limiter] Redis 비활성화 - ${prefix} 제한 없음`)
    return {
      limit: async (identifier: string) => ({
        success: true,
        limit: limit,
        remaining: limit,
        reset: Date.now() + 60000,
        pending: Promise.resolve(),
      }),
    }
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