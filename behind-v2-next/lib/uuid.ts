/**
 * 브라우저 호환 UUID 생성 유틸리티
 * crypto.randomUUID가 지원되지 않는 환경을 위한 폴백 제공
 */

/**
 * UUID v4를 생성합니다.
 * crypto.randomUUID가 지원되면 사용하고, 그렇지 않으면 대체 구현을 사용합니다.
 * @returns UUID v4 문자열
 */
export function generateUUID(): string {
  // 서버 환경에서는 빈 문자열 반환
  if (typeof window === 'undefined') return ''

  // crypto.randomUUID가 지원되는 경우
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch (e) {
      // 지원되더라도 실패할 수 있으므로 폴백 사용
      console.warn('crypto.randomUUID failed, using fallback', e)
    }
  }

  // 폴백: Math.random()을 사용한 UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
