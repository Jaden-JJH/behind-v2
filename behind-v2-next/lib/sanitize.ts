import DOMPurify from 'isomorphic-dompurify'

/**
 * HTML 태그 및 악성 스크립트 제거
 * @param dirty - 정제할 문자열
 * @returns 안전한 문자열
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''

  // 모든 HTML 태그 제거, 순수 텍스트만 반환
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // HTML 태그 모두 제거
    ALLOWED_ATTR: [], // 속성 모두 제거
    KEEP_CONTENT: true // 텍스트 내용은 유지
  })
}

/**
 * 여러 필드를 한번에 정제
 * @param fields - 정제할 필드들의 객체
 * @returns 정제된 객체
 */
export function sanitizeFields<T extends Record<string, any>>(
  fields: T,
  keysToSanitize: (keyof T)[]
): T {
  const sanitized = { ...fields }

  keysToSanitize.forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeHtml(sanitized[key]) as any
    }
  })

  return sanitized
}
