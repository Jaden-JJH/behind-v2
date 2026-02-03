import { generateUUID } from './uuid'

/**
 * device_hash 생성 및 관리
 * localStorage + 쿠키 기반으로 디바이스 고유 해시를 생성하고 유지합니다.
 * 쿠키에도 저장하여 서버 컴포넌트에서도 접근 가능하도록 합니다.
 */

/**
 * 디바이스 고유 해시를 가져오거나 생성합니다.
 * @returns device_hash 문자열 (서버 환경에서는 빈 문자열)
 */
export function getDeviceHash(): string {
  if (typeof window === 'undefined') return '';

  let hash = localStorage.getItem('device_hash');
  if (!hash) {
    hash = generateUUID();
    localStorage.setItem('device_hash', hash);

    // 쿠키에도 저장 (1년 유효, 서버에서도 접근 가능)
    document.cookie = `device_hash=${hash}; path=/; max-age=31536000; SameSite=Lax`;
  } else {
    // 이미 있는 경우에도 쿠키가 없으면 동기화
    if (!document.cookie.includes('device_hash=')) {
      document.cookie = `device_hash=${hash}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }

  return hash;
}

/**
 * 서버에서 쿠키로부터 deviceHash를 가져옵니다.
 * @param cookieString - 서버의 쿠키 문자열
 * @returns device_hash 문자열 또는 undefined
 */
export function getDeviceHashFromCookie(cookieString: string | undefined): string | undefined {
  if (!cookieString) return undefined;

  const match = cookieString.match(/device_hash=([^;]+)/);
  return match ? match[1] : undefined;
}
