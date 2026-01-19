'use client'

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, Users, ThumbsUp, ThumbsDown, Flag, ExternalLink, MoreVertical, AlertTriangle } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { QuickVote } from "@/components/quick-vote";
import { IssueFollowButton } from "@/components/issue-follow-button";
import { fetchChatRoomState } from "@/lib/chat-client";
import { formatTime } from "@/lib/utils";
import { showSuccess, showError, handleApiResponse } from '@/lib/toast-utils';
import { csrfFetch } from '@/lib/csrf-client';
import { useAuth } from '@/hooks/useAuth';
import type { ChatRoomState } from "@/lib/chat-types";
import { ArticleTimeline } from "@/components/article-timeline";
import type { IssueArticle } from "@/types/issue-articles";
import { UserProfileDrawer } from "@/components/user-profile-drawer";
import { ReportModal } from "@/components/ReportModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateUUID } from "@/lib/uuid";

// deviceHash 생성/가져오기 함수
function getDeviceHash(): string {
  if (typeof window === 'undefined') return ''

  let hash = localStorage.getItem('deviceHash')
  if (!hash) {
    hash = generateUUID()
    localStorage.setItem('deviceHash', hash)
  }
  return hash
}

// 유튜브 video ID 추출 함수
function extractYouTubeId(url: string): string | null {
  // 이미 ID만 있으면 그대로 반환
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return url;
  }

  // watch?v= 형식
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/ 형식
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  // embed/ 형식
  const embedMatch = url.match(/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

// API 응답 타입 정의
interface Poll {
  id: number;
  question: string;
  options: Array<{
    id: number;
    text: string;
    vote_count: number;
  }>;
}

interface IssueDetail {
  id: string;
  slug: string;
  title: string;
  preview: string;
  thumbnail?: string;
  media_embed?: {
    youtube?: string;
    news?: {
      title: string;
      source: string;
      url: string;
    };
  };
  view_count: number;
  capacity: number;
  category: string;
  status: string;
  comment_count: number;
  created_at: string;
  summary?: string;
  behind_story?: string;
  poll?: Poll;
  is_blinded?: boolean;
  blinded_at?: string;
}

interface ApiResponse {
  issue: IssueDetail;
  poll: Poll | null;
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;

  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatState, setChatState] = useState<ChatRoomState | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // 댓글 관련 state
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null);

  // 댓글 투표 상태 관리
  const [voteStates, setVoteStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const [lastVoteCommentId, setLastVoteCommentId] = useState<string | null>(null);
  const [lastVoteTime, setLastVoteTime] = useState(0);

  // 후속 기사 state
  const [articles, setArticles] = useState<IssueArticle[]>([]);

  // UserProfileDrawer state
  const [selectedNickname, setSelectedNickname] = useState<string | null>(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'issue' | 'poll' | 'comment';
    id: string;
  } | null>(null);

  // 신고하기 핸들러
  const handleOpenReport = (type: 'issue' | 'poll' | 'comment', id: string) => {
    setReportTarget({ type, id });
    setReportModalOpen(true);
  };

  // 로컬 스토리지에 투표 상태 저장/불러오기
  const saveVoteState = (commentId: string, voteType: 'up' | 'down' | null) => {
    if (typeof window === 'undefined') return;
    const key = `comment_vote_${commentId}`;
    if (voteType === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, voteType);
    }
  };

  const loadVoteState = (commentId: string): 'up' | 'down' | null => {
    if (typeof window === 'undefined') return null;
    const key = `comment_vote_${commentId}`;
    const saved = localStorage.getItem(key);
    return saved as 'up' | 'down' | null;
  };

  // 댓글 로드 시 투표 상태 복원
  useEffect(() => {
    if (comments.length > 0) {
      const states: Record<string, 'up' | 'down' | null> = {};
      comments.forEach((comment) => {
        states[comment.id] = loadVoteState(comment.id);
      });
      setVoteStates(states);
    }
  }, [comments.length]);

  // API 호출
  useEffect(() => {
    const fetchIssueDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/issues/${issueId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('이슈를 찾을 수 없습니다');
          } else {
            setError('오류가 발생했습니다');
          }
          return;
        }

        const data: ApiResponse = await response.json();
        setIssue({ ...data.issue, poll: data.poll || undefined });
      } catch (err) {
        console.error('Failed to fetch issue:', err);
        setError('오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetail();
  }, [issueId]);

  // 댓글 불러오기
  useEffect(() => {
    if (issue?.id) {
      loadComments();
    }
  }, [issue?.id, sortBy]);

  // 후속 기사 불러오기
  useEffect(() => {
    if (!issue?.id) return;

    const fetchArticles = async () => {
      try {
        const response = await fetch(`/api/issues/${issue.id}/articles`);
        if (!response.ok) return;
        const data = await response.json();
        setArticles(data.data || []);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
    };

    fetchArticles();
  }, [issue?.id]);

  useEffect(() => {
    if (!issue?.id) {
      setChatState(null);
      return;
    }

    const targetIssueId = String(issue.id);
    let cancelled = false;

    async function loadChatState() {
      try {
        setChatLoading(true);
        setChatError(null);
        const state = await fetchChatRoomState(targetIssueId);
        if (!cancelled) {
          setChatState(state);
        }
      } catch (err) {
        console.error('Failed to load chat room state:', err);
        if (!cancelled) {
          setChatError('채팅방 정보를 불러오지 못했습니다.');
          setChatState(null);
        }
      } finally {
        if (!cancelled) {
          setChatLoading(false);
        }
      }
    }

    loadChatState();

    return () => {
      cancelled = true;
    };
  }, [issue?.id]);

  async function loadComments() {
    if (!issue?.id) return;
    try {
      setCommentsLoading(true);
      setCommentsError('');
      const response = await fetch(`/api/comments?issueId=${issue.id}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || '댓글을 불러오지 못했습니다');

      let sortedComments = data.data || [];

      // 정렬
      if (sortBy === 'popular') {
        sortedComments = sortedComments.sort((a: any, b: any) =>
          (b.up - b.down) - (a.up - a.down)
        );
      }

      setComments(sortedComments);
    } catch (err: any) {
      setCommentsError(err.message);
      setComments([]);
      showError(err);
    } finally {
      setCommentsLoading(false);
    }
  }

  // 댓글 작성
  async function handleSubmitComment() {
    if (!user) {
      showError('로그인이 필요합니다');
      return;
    }

    if (!commentBody.trim()) {
      showError('댓글 내용을 입력해주세요');
      return;
    }

    if (commentBody.length < 2 || commentBody.length > 500) {
      showError('댓글은 2자 이상 500자 이하로 작성해주세요');
      return;
    }

    const nick = user.user_metadata?.nickname || '익명';

    try {
      setSubmitting(true);
      const response = await csrfFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue?.id,
          body: commentBody,
          userNick: nick
        })
      });

      await handleApiResponse(response);

      // 성공 시 초기화 및 새로고침
      setCommentBody('');
      showSuccess('댓글이 등록되었습니다');
      loadComments();
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  }

  // 댓글 투표
  async function handleVote(commentId: string, voteType: 'up' | 'down') {
    if (votingCommentId) return

    // 다른 댓글로 이동 시 2초 제한 유지
    if (lastVoteCommentId && lastVoteCommentId !== commentId) {
      const timeSinceLastVote = Date.now() - lastVoteTime
      if (timeSinceLastVote < 2000) {
        showError('잠시 후 다시 시도해주세요')
        return
      }
    }

    try {
      setVotingCommentId(commentId)
      const deviceHash = getDeviceHash()
      const currentVote = voteStates[commentId] // 'up' | 'down' | null

      const response = await csrfFetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType, deviceHash }),
      })

      // 공통 응답 핸들러 (토스트 포함)
      const result = await handleApiResponse<{ up: number; down: number }>(response)
      // 서버에서 { success:true, data:{ up, down } } 형태
      const { up, down } = result

      // 프론트의 투표상태는 기존 로직 유지 (현재 클릭 = 취소, 아니면 전환)
      const newState = currentVote === voteType ? null : voteType

      setVoteStates(prev => ({ ...prev, [commentId]: newState }))
      saveVoteState(commentId, newState)

      // 카운트는 서버 값으로 덮어쓰기 (싱크 보장)
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, up, down } : c))
      )

      // rate limit 기록
      setLastVoteCommentId(commentId)
      setLastVoteTime(Date.now())
    } catch (err: any) {
      showError(err)
    } finally {
      setVotingCommentId(null)
    }
  }


  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !issue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground mb-4">{error || '이슈를 찾을 수 없습니다'}</div>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const chatActiveMembers = chatState?.activeMembers ?? 0;
  const chatCapacity = chatState?.capacity ?? 0;
  const isChatFull = chatCapacity > 0 && chatActiveMembers >= chatCapacity;
  const chatStatusLabel = chatLoading
    ? '채팅 인원 확인 중...'
    : chatError
      ? chatError
      : `${chatActiveMembers}/${chatCapacity || 0} 참여중`;
  const joinDisabled = isChatFull || !!chatError;
  const joinLabel = isChatFull ? '정원 마감' : chatError ? '입장 불가' : '채팅방 입장';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 md:py-4">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="mb-2 flex-1 text-base sm:text-lg md:text-xl font-bold">{issue.title}</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleOpenReport('issue', issue.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      신고하기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1 text-xs sm:text-sm">
                  <Users className="w-3.5 h-3.5" />
                  {chatStatusLabel}
                </span>
                {isChatFull && !chatError && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full">
                    정원 마감
                  </span>
                )}
                {issue.view_count > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="flex items-center gap-1 text-xs sm:text-sm">
                      <Eye className="w-3.5 h-3.5" />
                      조회수 {issue.view_count}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IssueFollowButton issueId={issue.id} />
              <div className="flex flex-col items-end gap-1">
                <Button
                  disabled={joinDisabled}
                  className="min-w-[120px]"
                  onClick={() => {
                    if (!joinDisabled) {
                      router.push(`/chat/${issue.id}`);
                    }
                  }}
                >
                  {joinLabel}
                </Button>
                {isChatFull && (
                  <span className="text-xs text-rose-500">정원이 가득 찼습니다.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-8 space-y-4 sm:space-y-5 md:space-y-6">
        {/* 썸네일 이미지 */}
        <div className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden">
          <ImageWithFallback
            src={issue.thumbnail}
            alt={issue.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 블라인드 처리 알림 또는 사건 요약 */}
        {issue.is_blinded ? (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-12 h-12 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    블라인드 처리된 콘텐츠
                  </h3>
                  <p className="text-yellow-800 leading-relaxed mb-2">
                    이 이슈는 신고 누적으로 인해 관리자에 의해 블라인드 처리되었습니다.
                  </p>
                  <p className="text-sm text-yellow-700">
                    처리 시간: {issue.blinded_at ? new Date(issue.blinded_at).toLocaleString('ko-KR') : '정보 없음'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>사건 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {issue.summary || issue.preview}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 관련 미디어 */}
        {issue.media_embed && (
          <Card>
            <CardHeader>
              <CardTitle>관련 미디어</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 유튜브 임베드 */}
              {issue.media_embed.youtube && (() => {
                const videoId = extractYouTubeId(issue.media_embed.youtube);
                if (!videoId) return null;

                return (
                  <div>
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* 뉴스 기사 */}
              {issue.media_embed.news && 'url' in issue.media_embed.news && (
                <div className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {issue.media_embed.news.source}
                      </p>
                      <h3 className="font-semibold text-base mb-2 line-clamp-2">
                        {issue.media_embed.news.title}
                      </h3>
                      <a
                        href={issue.media_embed.news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        기사 전문 보기
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 에디터 노트 */}
        {issue.behind_story && (
          <Card>
            <CardHeader>
              <CardTitle>에디터 노트</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {issue.behind_story}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 후속 기사 타임라인 */}
        {articles.length > 0 && (
          <ArticleTimeline articles={articles} />
        )}

        {/* 투표 - poll 데이터가 있을 때만 표시 */}
        {issue.poll && issue.poll.options && issue.poll.options.length >= 2 ? (
          <QuickVote
            pollId={String(issue.poll.id)}
            question={issue.poll.question}
            options={issue.poll.options.map((opt: any) => ({
              id: opt.id,
              label: opt.label,
              count: opt.vote_count
            }))}
            ctaLabel="진행 중인 투표 모아보기"
            onCta={() => {
              window.location.href = "/issues";
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              투표가 없습니다
            </CardContent>
          </Card>
        )}

        {/* 댓글 */}
        <div id="comments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2>댓글</h2>
            <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'popular')}>
              <TabsList>
                <TabsTrigger value="popular">인기순</TabsTrigger>
                <TabsTrigger value="recent">최신순</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 댓글 작성 */}
          {!user ? (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-muted-foreground">
                  로그인하고 댓글을 남겨보세요
                </p>
                <Button onClick={() => signInWithGoogle(window.location.pathname)} disabled={authLoading}>
                  구글로 로그인
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <Textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="댓글을 남겨보세요"
                  className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] mb-3 sm:mb-3.5 md:mb-4 resize-none text-sm sm:text-base"
                  disabled={submitting}
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {user.user_metadata?.nickname || '익명'} · 커뮤니티 가이드라인 준수
                  </p>
                  <Button onClick={handleSubmitComment} disabled={submitting} className="flex-shrink-0">
                    {submitting ? '등록 중...' : '등록'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 댓글 목록 */}
          {commentsLoading && (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              댓글을 불러오는 중...
            </div>
          )}

          {commentsError && (
            <div className="text-center py-8 text-sm sm:text-base text-red-500">
              {commentsError}
            </div>
          )}

          {!commentsLoading && !commentsError && comments.length === 0 && (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              첫 댓글을 남겨보세요!
            </div>
          )}

          {!commentsLoading && !commentsError && comments.length > 0 && (
            <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
              {comments.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{c.user_nick.slice(-1)}</AvatarFallback>
                        </Avatar>
                        <div>
                          {c.user_nick ? (
                            <button
                              onClick={() => setSelectedNickname(c.user_nick)}
                              className="text-sm hover:underline cursor-pointer text-left bg-transparent border-none p-0"
                            >
                              {c.user_nick}
                            </button>
                          ) : (
                            <p className="text-sm text-muted-foreground">익명</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatTime(c.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenReport('comment', c.id)}
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                    {c.is_blinded ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2 md:mb-3">
                        <div className="flex items-center gap-2 text-yellow-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            블라인드 처리된 댓글입니다
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-3.5 md:mb-4">{c.body}</p>
                    )}
                    <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                      <Button
                        variant={voteStates[c.id] === 'up' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleVote(c.id, 'up')}
                        disabled={votingCommentId === c.id}
                        className="min-h-[44px]"
                      >
                        <ThumbsUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-1.5" />
                        {c.up}
                      </Button>
                      <Button
                        variant={voteStates[c.id] === 'down' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleVote(c.id, 'down')}
                        disabled={votingCommentId === c.id}
                        className="min-h-[44px]"
                      >
                        <ThumbsDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-1.5" />
                        {c.down}
                      </Button>
                      <Button variant="ghost" size="sm" className="min-h-[44px]">
                        답글
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <UserProfileDrawer
        nickname={selectedNickname || ''}
        open={selectedNickname !== null}
        onOpenChange={(open) => !open && setSelectedNickname(null)}
      />

      {reportTarget && (
        <ReportModal
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          contentType={reportTarget.type}
          contentId={reportTarget.id}
        />
      )}

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        © 2026 스톤즈랩. 대한민국 No.1 뉴스 아카이브.
      </footer>
    </div>
  );
}
