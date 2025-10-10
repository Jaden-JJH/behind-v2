'use client'

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, ThumbsUp, ThumbsDown, Flag, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { QuickVote } from "@/components/quick-vote";
import { formatTime } from "@/lib/utils";

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
interface IssueDetail {
  id: number;
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
}

interface Poll {
  id: number;
  question: string;
  options: Array<{
    id: number;
    text: string;
    vote_count: number;
  }>;
}

interface ApiResponse {
  issue: IssueDetail;
  poll: Poll | null;
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 댓글 데이터 (하드코딩 유지 - 추후 API 구현 예정)
  const comments = [
    { id: 1, author: "익명1", time: Date.now() - 600000, text: "내부자 개입 가능성 높다고 봅니다. 권한이 없으면 저런 로그가 안 남아요.", up: 24, down: 3 },
    { id: 2, author: "익명2", time: Date.now() - 1500000, text: "외부 피싱에서 시작됐다는 얘기도 있어요. 연쇄로 확장됐을 듯.", up: 17, down: 5 },
    { id: 3, author: "익명3", time: Date.now() - 3600000, text: "통신사 보안 체계 개선안 누가 책임질지 궁금.", up: 9, down: 1 },
  ];

  const [sortBy, setSortBy] = useState("popular");

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
        setIssue(data.issue);
        setPoll(data.poll);
      } catch (err) {
        console.error('Failed to fetch issue:', err);
        setError('오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchIssueDetail();
  }, [issueId]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2">{issue.title}</h1>
              <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                <span>{issue.capacity}명 정원</span>
                {issue.view_count > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="flex items-center gap-1 text-sm">
                      <Eye className="w-3.5 h-3.5" />
                      조회수 {issue.view_count}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Link href={`/chat/${issue.id}`}>
              <Button>
                채팅방 입장
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 썸네일 이미지 */}
        {issue.thumbnail && (
          <div className="relative w-full aspect-video bg-muted rounded-xl overflow-hidden">
            <ImageWithFallback
              src={issue.thumbnail}
              alt={issue.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 사건 요약 */}
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

        {/* 비하인드 */}
        {issue.behind_story && (
          <Card>
            <CardHeader>
              <CardTitle>비하인드</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {issue.behind_story}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 투표 - poll 데이터가 있을 때만 표시 */}
        {poll && poll.options && poll.options.length >= 2 ? (
          <QuickVote
            pollId={`poll_${issue.id}`}
            question={poll.question}
            options={poll.options.map(opt => ({
              label: opt.label,
              count: opt.vote_count
            }))}
            ctaLabel="댓글 보러가기"
            onCta={() => {
              const el = document.getElementById("comments");
              if (el) el.scrollIntoView({ behavior: "smooth" });
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
            <Tabs value={sortBy} onValueChange={setSortBy}>
              <TabsList>
                <TabsTrigger value="popular">인기순</TabsTrigger>
                <TabsTrigger value="recent">최신순</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 댓글 작성 */}
          <Card>
            <CardContent className="p-4">
              <Textarea
                placeholder="익명으로 댓글을 남겨보세요"
                className="min-h-[100px] mb-3 resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">익명 · 커뮤니티 가이드라인 준수</p>
                <Button>등록</Button>
              </div>
            </CardContent>
          </Card>

          {/* 댓글 목록 */}
          <div className="space-y-3">
            {comments.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{c.author.slice(-1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">{c.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(c.time)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">{c.text}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                      {c.up}
                    </Button>
                    <Button variant="outline" size="sm">
                      <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                      {c.down}
                    </Button>
                    <Button variant="ghost" size="sm">
                      답글
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button variant="outline">
              더 보기
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        © 2025 비하인드. 모두의 뒷얘기 살롱.
      </footer>
    </div>
  );
}
