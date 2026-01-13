import { generateUUID } from './uuid'

/**
 * device_hash 생성 및 관리
 * localStorage 기반으로 디바이스 고유 해시를 생성하고 유지합니다.
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
  }
  return hash;
}
