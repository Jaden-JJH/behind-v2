/**
 * 클라이언트 사이드 CSRF 토큰 관리
 */

/**
 * 쿠키에서 CSRF 토큰 읽기
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
  
  if (!csrfCookie) return null;
  
  return csrfCookie.split('=')[1];
}

/**
 * CSRF 토큰을 서버에서 가져오기
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf');
    const data = await response.json();
    
    if (data.success && data.data.token) {
      return data.data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * CSRF 토큰을 포함한 fetch 옵션 생성
 */
export async function withCsrfToken(options: RequestInit = {}): Promise<RequestInit> {
  let token = getCsrfTokenFromCookie();
  
  // 쿠키에 토큰이 없으면 서버에서 가져오기
  if (!token) {
    token = await fetchCsrfToken();
  }
  
  if (!token) {
    throw new Error('CSRF token is not available');
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
    },
  };
}

/**
 * CSRF 보호가 적용된 fetch 래퍼
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const method = options.method?.toUpperCase() || 'GET';
  
  // GET 요청은 CSRF 토큰 불필요
  if (!protectedMethods.includes(method)) {
    return fetch(url, options);
  }
  
  // CSRF 토큰 추가
  const csrfOptions = await withCsrfToken(options);
  return fetch(url, csrfOptions);
}