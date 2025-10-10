import { toast } from "sonner"

// Toast 타입
export type ToastType = 'success' | 'error' | 'info' | 'warning'

// API 에러 응답 타입
interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// 에러 메시지 표시
export function showError(error: any) {
  let message = '오류가 발생했습니다'

  // API 에러 응답 형식인 경우
  if (error?.error?.message) {
    message = error.error.message
  }
  // 일반 Error 객체인 경우
  else if (error?.message) {
    message = error.message
  }
  // 문자열인 경우
  else if (typeof error === 'string') {
    message = error
  }

  toast.error('오류', {
    description: message,
  })
}

// 성공 메시지 표시
export function showSuccess(message: string) {
  toast.success('성공', {
    description: message,
  })
}

// 일반 정보 메시지 표시
export function showInfo(message: string) {
  toast.info(message)
}

// 경고 메시지 표시
export function showWarning(message: string) {
  toast.warning('경고', {
    description: message,
  })
}

// API 응답 처리 헬퍼
export async function handleApiResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    showError(data)
    throw new Error(data.error?.message || 'API 요청 실패')
  }

  return data.data
}

// Promise 자동 처리 (로딩 -> 성공/실패)
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error?: string | ((error: any) => string)
  }
): Promise<T> {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error || '오류가 발생했습니다',
  })
}
