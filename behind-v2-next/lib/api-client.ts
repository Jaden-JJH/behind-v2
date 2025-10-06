// API 호출 공통 함수
export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

// 이슈 조회
export async function fetchIssues() {
  return apiClient<{ success: boolean; data: any[]; count: number }>('/api/issues')
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
