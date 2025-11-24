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

/**
 * 소셜 미디어 임베드 HTML을 안전하게 정제
 * Twitter/Instagram 임베드 코드에 필요한 태그와 속성만 허용
 * @param html - 임베드 HTML 코드
 * @returns 정제된 임베드 HTML
 */
export function sanitizeEmbedHTML(html: string): string {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // 구조 태그
      'div', 'span', 'p', 'a', 'img', 'iframe',
      // 소셜 미디어 임베드에 필요한 태그
      'blockquote', 'script', 'figure', 'figcaption',
      // 텍스트 포맷팅
      'strong', 'em', 'b', 'i', 'u', 'br'
    ],
    ALLOWED_ATTR: [
      // 공통 속성
      'class', 'id', 'style', 'data-*',
      // 링크 속성
      'href', 'target', 'rel',
      // 이미지 속성
      'src', 'alt', 'width', 'height', 'loading',
      // iframe 속성
      'allowfullscreen', 'frameborder', 'scrolling',
      // Twitter/Instagram 전용 속성
      'cite', 'data-tweet-id', 'data-instagram-id'
    ],
    ALLOW_DATA_ATTR: true, // data-* 속성 허용
    ADD_ATTR: ['target'], // target 속성 추가 허용
    ALLOW_UNKNOWN_PROTOCOLS: false, // 알 수 없는 프로토콜 차단
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  })
}
