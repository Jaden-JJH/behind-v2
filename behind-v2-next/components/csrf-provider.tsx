'use client';

import { useEffect } from 'react';
import { fetchCsrfToken } from '@/lib/csrf-client';

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 앱 로드 시 CSRF 토큰 초기화
    fetchCsrfToken().catch(err => {
      console.error('Failed to initialize CSRF token:', err);
    });
  }, []);

  return <>{children}</>;
}
