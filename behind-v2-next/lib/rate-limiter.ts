import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Redis 클라이언트 초기화
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate Limiter 인스턴스들
export const commentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 1분당 5회
  analytics: true,
  prefix: 'ratelimit:comment',
})

export const voteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'), // 1분당 3회
  analytics: true,
  prefix: 'ratelimit:vote',
})

export const adminAuthLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 1분당 5회
  analytics: true,
  prefix: 'ratelimit:admin-auth',
})

export const curiousLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'), // 1분당 3회
  analytics: true,
  prefix: 'ratelimit:curious',
})

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