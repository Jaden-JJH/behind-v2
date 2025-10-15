import { csrfFetch } from './csrf-client'

// API 호출 공통 함수
export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await csrfFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: any = new Error(errorData.error || `API error: ${response.status}`);
    error.status = response.status;
    error.code = errorData.code;
    throw error;
  }

  return response.json()
}

// 이슈 조회
export async function fetchIssues(params?: { includeAll?: boolean; limit?: number; offset?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.includeAll) searchParams.set('includeAll', 'true')
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const url = `/api/issues${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  return apiClient<{ success: boolean; data: any[]; count: number }>(url)
}

// 투표
export async function vote(pollId: string, optionId: string, deviceHash: string) {
  return apiClient<{ success: boolean; data: any[] }>('/api/vote', {
    method: 'POST',
    body: JSON.stringify({ pollId, optionId, deviceHash }),
  })
}

// 댓글 조회
export async function fetchComments(issueId: string) {
  return apiClient<{ success: boolean; data: any[]; count: number }>(
    `/api/comments?issueId=${issueId}`
  )
}

// 댓글 작성
export async function createComment(issueId: string, body: string, userNick: string) {
  return apiClient<{ success: boolean; data: any }>('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ issueId, body, userNick }),
  })
}

// 제보 목록 조회
export async function fetchReports(params?: {
  visibility?: string;
  approval_status?: string;
  sortBy?: string;
  device_hash?: string;
  my_curious?: boolean;
}) {
  const searchParams = new URLSearchParams()
  if (params?.visibility) searchParams.set('visibility', params.visibility)
  if (params?.approval_status) searchParams.set('approval_status', params.approval_status)
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.device_hash) searchParams.set('device_hash', params.device_hash)
  if (params?.my_curious) searchParams.set('my_curious', 'true')

  const url = `/api/reports${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  return apiClient<{ success: boolean; data: any[]; count: number }>(url)
}

// 궁금해요 누르기
export async function curiousReport(reportId: string, deviceHash: string) {
  return apiClient<{ success: boolean; data: any }>(`/api/reports/${reportId}/curious`, {
    method: 'POST',
    body: JSON.stringify({ deviceHash }),
  })
}

