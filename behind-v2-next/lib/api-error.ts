import { NextResponse } from 'next/server'

// 표준 에러 응답 타입
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// 표준 성공 응답 타입
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  count?: number
}

// 에러 코드 정의 (실제 사용 중인 것만)
export enum ErrorCode {
  // 일반 에러
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_FIELDS = 'MISSING_FIELDS',

  // 계정 관련 (추가)
  UNAUTHORIZED = 'UNAUTHORIZED',
  NICKNAME_TAKEN = 'NICKNAME_TAKEN',
  NICKNAME_INVALID = 'NICKNAME_INVALID',
  NICKNAME_CHANGE_TOO_SOON = 'NICKNAME_CHANGE_TOO_SOON',
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
  ACCOUNT_ALREADY_DELETED = 'ACCOUNT_ALREADY_DELETED',
  ACCOUNT_DELETE_FAILED = 'ACCOUNT_DELETE_FAILED',

  // 댓글 관련
  COMMENT_TOO_SHORT = 'COMMENT_TOO_SHORT',
  COMMENT_TOO_LONG = 'COMMENT_TOO_LONG',
  NICKNAME_TOO_SHORT = 'NICKNAME_TOO_SHORT',
  NICKNAME_TOO_LONG = 'NICKNAME_TOO_LONG',
  COMMENT_FETCH_FAILED = 'COMMENT_FETCH_FAILED',
  COMMENT_CREATE_FAILED = 'COMMENT_CREATE_FAILED',

  // 투표 관련
  DUPLICATE_VOTE = 'DUPLICATE_VOTE',
  INVALID_OPTION = 'INVALID_OPTION',
  VOTE_FAILED = 'VOTE_FAILED',

  // 이슈 관련
  ISSUE_FETCH_FAILED = 'ISSUE_FETCH_FAILED',

  // 채팅 관련
  CHAT_ROOM_NOT_FOUND = 'CHAT_ROOM_NOT_FOUND',
  CHAT_ROOM_FULL = 'CHAT_ROOM_FULL',
  CHAT_MEMBER_CONFLICT = 'CHAT_MEMBER_CONFLICT',
  CHAT_MEMBER_NOT_FOUND = 'CHAT_MEMBER_NOT_FOUND',
  CHAT_MESSAGE_TOO_LONG = 'CHAT_MESSAGE_TOO_LONG',
  CHAT_MESSAGE_FAILED = 'CHAT_MESSAGE_FAILED',
  CHAT_RATE_LIMITED = 'CHAT_RATE_LIMITED',

  // 댓글 투표
  COMMENT_VOTE_ALREADY = 'ALREADY_VOTED',
  COMMENT_VOTE_FAILED = 'COMMENT_VOTE_FAILED'
}

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_ERROR]: '서버 오류가 발생했습니다',
  [ErrorCode.INVALID_REQUEST]: '잘못된 요청입니다',
  [ErrorCode.MISSING_FIELDS]: '필수 항목이 누락되었습니다',
  [ErrorCode.UNAUTHORIZED]: '로그인이 필요합니다',
  [ErrorCode.NICKNAME_TAKEN]: '이미 사용 중인 닉네임입니다',
  [ErrorCode.NICKNAME_INVALID]: '닉네임 형식이 올바르지 않습니다',
  [ErrorCode.NICKNAME_CHANGE_TOO_SOON]: '닉네임은 30일에 1회만 변경할 수 있습니다',
  [ErrorCode.LOGIN_REQUIRED]: '로그인이 필요합니다',
  [ErrorCode.ACCOUNT_ALREADY_DELETED]: '이미 탈퇴한 계정입니다',
  [ErrorCode.ACCOUNT_DELETE_FAILED]: '회원 탈퇴 처리에 실패했습니다',

  [ErrorCode.COMMENT_TOO_SHORT]: '댓글은 2자 이상 작성해주세요',
  [ErrorCode.COMMENT_TOO_LONG]: '댓글은 500자 이하로 작성해주세요',
  [ErrorCode.NICKNAME_TOO_SHORT]: '닉네임은 2자 이상이어야 합니다',
  [ErrorCode.NICKNAME_TOO_LONG]: '닉네임은 20자 이하여야 합니다',
  [ErrorCode.COMMENT_FETCH_FAILED]: '댓글을 불러오지 못했습니다',
  [ErrorCode.COMMENT_CREATE_FAILED]: '댓글 작성에 실패했습니다',

  [ErrorCode.DUPLICATE_VOTE]: '이미 투표하셨습니다',
  [ErrorCode.INVALID_OPTION]: '유효하지 않은 선택지입니다',
  [ErrorCode.VOTE_FAILED]: '투표 처리에 실패했습니다',

  [ErrorCode.ISSUE_FETCH_FAILED]: '이슈를 불러오지 못했습니다',

  [ErrorCode.COMMENT_VOTE_ALREADY]: '이미 투표하셨습니다',
  [ErrorCode.COMMENT_VOTE_FAILED]: '댓글 투표 처리에 실패했습니다',

  [ErrorCode.CHAT_ROOM_NOT_FOUND]: '채팅방을 찾을 수 없습니다',
  [ErrorCode.CHAT_ROOM_FULL]: '채팅방 정원이 가득 찼습니다',
  [ErrorCode.CHAT_MEMBER_CONFLICT]: '이미 참여 중인 사용자입니다',
  [ErrorCode.CHAT_MEMBER_NOT_FOUND]: '채팅 참여 정보를 찾을 수 없습니다',
  [ErrorCode.CHAT_MESSAGE_TOO_LONG]: '메시지가 너무 깁니다',
  [ErrorCode.CHAT_MESSAGE_FAILED]: '메시지를 전송하지 못했습니다',
  [ErrorCode.CHAT_RATE_LIMITED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요'
}

// 에러 응답 생성 함수
export function createErrorResponse(
  code: ErrorCode,
  statusCode: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: ERROR_MESSAGES[code],
        details
      }
    },
    { status: statusCode }
  )
}

// 성공 응답 생성 함수
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  count?: number
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data
  }

  if (count !== undefined) {
    response.count = count
  }

  return NextResponse.json(response, { status: statusCode })
}

// Supabase 에러 처리
export function handleSupabaseError(error: any, context: string = ''): NextResponse {
  console.error(`Supabase error (${context}):`, error)

  // 특정 Postgres 에러 코드 처리
  if (error.code === '23505') {
    // UNIQUE constraint violation
    return createErrorResponse(ErrorCode.DUPLICATE_VOTE, 409)
  }

  if (error.code === '23503') {
    // Foreign key violation
    return createErrorResponse(ErrorCode.INVALID_OPTION, 404)
  }

  // 기본 에러
  return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
}

// 검증 에러 헬퍼
export function validateRequired(fields: Record<string, any>): string[] {
  const missing: string[] = []
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      missing.push(key)
    }
  }
  return missing
}
