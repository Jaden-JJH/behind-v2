'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Users, TrendingUp, ArrowLeft, Send, ArrowUp, ArrowDown, Clock, ThumbsUp, ThumbsDown, Flag, Shuffle, ChevronDown, Flame, ExternalLink, Eye } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

/** =========================
 *  Utils + Lightweight Tests
 *  ========================= */
const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeOptions = (options) => {
  const arr = Array.isArray(options) ? options.filter(Boolean) : [];
  const filled = arr.map((o, i) => ({ label: o.label ?? `옵션 ${i + 1}`, count: toSafeNumber(o.count) }));
  while (filled.length < 2) filled.push({ label: `옵션 ${filled.length + 1}`, count: 0 });
  return filled.slice(0, 2);
};

export const initCountsFromOptions = (options) => normalizeOptions(options).map((o) => toSafeNumber(o.count));

export const incrementAtIndex = (arr, idx) => {
  const base = Array.isArray(arr) ? Array.from(arr) : [];
  const i = Number(idx);
  if (!Number.isInteger(i) || i < 0 || i >= base.length) return base;
  base[i] = toSafeNumber(base[i]) + 1;
  return base;
};

// Storage helpers
const getLS = (k, fallback = null) => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};
const setLS = (k, v) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const voteKey = (pollId) => `bh_voted_${encodeURIComponent(pollId)}`;
const getStoredVote = (pollId) => {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(voteKey(pollId));
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
};
const setStoredVote = (pollId, idx) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(voteKey(pollId), String(idx));
  } catch {}
};

// Chat helpers
const chatKey = (roomId) => `bh_chat_${roomId}`;
const nickKey = (roomId) => `bh_nick_${roomId}`;
function randomNickname() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `활동자${num}`;
}

// Time formatting
const formatTime = (ts) => {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

/** =========================
 *  QuickVote - 개선된 투표 컴포넌트
 *  ========================= */
function QuickVote({ pollId, question, options, ctaLabel = "댓글 토론 참여하기", onCta }) {
  const safeOptions = useMemo(() => normalizeOptions(options), [options]);
  const [counts, setCounts] = useState(() => initCountsFromOptions(safeOptions));
  const [selected, setSelected] = useState(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const saved = getStoredVote(pollId || question || "");
    if (saved != null && Number.isInteger(saved)) {
      setSelected(saved);
      setVoted(true);
    }
  }, [pollId, question]);

  const total = (Array.isArray(counts) ? counts : []).reduce((a, b) => toSafeNumber(a) + toSafeNumber(b), 0);

  const handleVote = (idx) => {
    if (voted) return;
    setCounts((prev) => incrementAtIndex(prev, idx));
    setSelected(idx);
    setVoted(true);
    setStoredVote(pollId || question || "", idx);
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-800">{question}</CardTitle>
        <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
          {toSafeNumber(total).toLocaleString()}명 참여
        </p>
      </CardHeader>
      <CardContent>
        {!voted ? (
          <div className="flex gap-3">
            {safeOptions.map((o, idx) => (
              <Button
                key={`${o.label}-${idx}`}
                onClick={() => handleVote(idx)}
                variant="outline"
                className="flex-1 h-auto py-3 border-slate-300 text-slate-700 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 transition-all"
              >
                {o.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {safeOptions.map((o, idx) => {
              const c = toSafeNumber(counts?.[idx]);
              const t = Math.max(1, toSafeNumber(total));
              const pct = Math.round((c / t) * 100);
              const chosen = selected === idx;
              return (
                <div key={`res-${idx}`} className={`relative p-3 rounded-lg border-2 transition-all ${chosen ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className={chosen ? "text-indigo-900 font-medium" : "text-slate-700"}>{o.label}</span>
                    <span className={`${chosen ? "text-indigo-700 font-semibold" : "text-slate-500"} tabular-nums text-sm`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ease-out ${chosen ? "bg-indigo-600" : "bg-slate-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {onCta && (
              <Button
                onClick={onCta}
                variant="outline"
                className="w-full mt-2 border-indigo-500 text-indigo-700 hover:bg-indigo-50"
              >
                {ctaLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** =========================
 *  IssueCard - 레딧 스타일 이슈 카드
 *  ========================= */
function IssueCard({ issue, onOpenIssue, onOpenChat }) {
  const [upvotes, setUpvotes] = useState(issue.upvotes || 0);
  const [voted, setVoted] = useState(null);

  const handleVote = (type) => {
    if (voted === type) {
      setUpvotes(upvotes + (type === 'up' ? -1 : 1));
      setVoted(null);
    } else {
      if (voted) {
        setUpvotes(upvotes + (type === 'up' ? 2 : -2));
      } else {
        setUpvotes(upvotes + (type === 'up' ? 1 : -1));
      }
      setVoted(type);
    }
  };

  return (
    <Card className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* 썸네일 */}
        {issue.thumbnail && (
          <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onOpenIssue(issue.id)}>
            <ImageWithFallback
              src={issue.thumbnail}
              alt={issue.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3
              className="text-lg font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors leading-snug"
              onClick={() => onOpenIssue(issue.id)}
            >
              {issue.title}
            </h3>
            <p className="text-slate-600 text-base leading-relaxed line-clamp-2">{issue.preview}</p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">{issue.commentCount || 0}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-medium">{issue.participants}/{issue.capacity}</span>
              </span>
              {issue.liveViewers && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">{issue.liveViewers}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => onOpenIssue(issue.id)}>
                자세히
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => onOpenChat(issue.id)}>
                채팅 입장
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** =========================
 *  ChatRoom - 개선된 채팅방
 *  ========================= */
function ChatRoom({ roomId, issueTitle, participants, capacity = 30, onBack }) {
  const [nick, setNick] = useState(() => getLS(nickKey(roomId), randomNickname()));
  const [messages, setMessages] = useState(() => getLS(chatKey(roomId), null) || [
    { id: 1, author: "운영봇", text: "오늘 이슈 요약: 내부자 개입 가능성 제기", ts: Date.now() - 1000 * 60 * 30, isSystem: true },
    { id: 2, author: "활동자1014", text: "보안팀이 뚫린거면 진짜 심각한거 아님?", ts: Date.now() - 1000 * 60 * 20 },
    { id: 3, author: "활동자5823", text: "ㄹㅇ... 나도 걱정된다", ts: Date.now() - 1000 * 60 * 10 },
  ]);
  const [input, setInput] = useState("");
  const scrollerRef = useRef(null);

  useEffect(() => { setLS(chatKey(roomId), messages); }, [roomId, messages]);
  useEffect(() => { setLS(nickKey(roomId), nick); }, [roomId, nick]);
  useEffect(() => { 
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const next = messages.concat([{ id: Date.now(), author: nick, text, ts: Date.now() }]);
    setMessages(next);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="truncate">{issueTitle}</h1>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground flex-wrap">
                <span>{participants}/{capacity}</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="truncate">
                  <strong className="text-foreground">{nick}</strong>
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setNick(randomNickname())}
            >
              <Shuffle className="w-4 h-4 mr-1.5" />
              닉네임 변경
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-0">
            <div ref={scrollerRef} className="h-[500px] overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                  <p>아직 메시지가 없습니다.</p>
                  <p className="text-sm">첫 메시지를 남겨보세요!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isOwn = m.author === nick && !m.isSystem;
                  const isSystem = m.isSystem;
                  
                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="bg-muted px-3 py-1.5 rounded-full max-w-md text-center">
                          <p className="text-muted-foreground">{m.text}</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={m.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={isOwn ? "bg-indigo-600 text-white" : "bg-muted"}>
                          {m.author.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                        {!isOwn && (
                          <span className="text-sm text-muted-foreground px-1">{m.author}</span>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${isOwn ? "bg-indigo-600 text-white" : "bg-muted"}`}>
                          <p className="break-words">{m.text}</p>
                        </div>
                        <span className="text-xs text-muted-foreground px-1">{formatTime(m.ts)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
          />
          <Button onClick={send} disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        © 2025 비하인드. 모두의 뒷얘기 살롱.
      </footer>
    </div>
  );
}

/** =========================
 *  IssueDetailPage - 개선된 이슈 상세
 *  ========================= */
function IssueDetailPage({ issue, onBack, onJoinChat }) {
  const comments = [
    { id: 1, author: "익명1", time: Date.now() - 600000, text: "내부자 개입 가능성 높다고 봅니다. 권한이 없으면 저런 로그가 안 남아요.", up: 24, down: 3 },
    { id: 2, author: "익명2", time: Date.now() - 1500000, text: "외부 피싱에서 시작됐다는 얘기도 있어요. 연쇄로 확장됐을 듯.", up: 17, down: 5 },
    { id: 3, author: "익명3", time: Date.now() - 3600000, text: "통신사 보안 체계 개선안 누가 책임질지 궁금.", up: 9, down: 1 },
  ];

  const [sortBy, setSortBy] = useState("popular");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2">{issue.title}</h1>
              <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                <span>{issue.participants}/{issue.capacity} 참여중</span>
                {issue.liveViewers && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="flex items-center gap-1 text-sm">
                      <Eye className="w-3.5 h-3.5" />
                      조회수 {issue.liveViewers}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Button onClick={onJoinChat}>
              채팅방 입장
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 썸네일 이미지 */}
        {issue.thumbnail && (
          <div className="w-full h-64 rounded-xl overflow-hidden bg-muted">
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
            <p className="text-muted-foreground leading-relaxed">{issue.preview}</p>
          </CardContent>
        </Card>

        {/* 관련 미디어 */}
        {issue.mediaEmbed && (
          <Card>
            <CardHeader>
              <CardTitle>관련 미디어</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 유튜브 임베드 */}
              {issue.mediaEmbed.youtube && (
                <div>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${issue.mediaEmbed.youtube}`}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
              
              {/* 뉴스 링크 */}
              {issue.mediaEmbed.news && issue.mediaEmbed.news.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm text-muted-foreground">관련 뉴스</h4>
                  {issue.mediaEmbed.news.map((article, idx) => (
                    <a 
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
                    >
                      <div className="flex-1">
                        <p className="group-hover:text-indigo-700 transition-colors">{article.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{article.source}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 비하인드 */}
        <Card>
          <CardHeader>
            <CardTitle>비하인드</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              일부 전문가들은 내부자 개입 가능성을 제기했으며, 추가 제보가 이어지고 있습니다.
            </p>
          </CardContent>
        </Card>

        {/* 투표 */}
        <QuickVote
          pollId={`poll_${issue.id}_detail`}
          question="내부자 개입 가능성, 어떻게 생각하십니까?"
          options={[
            { label: "높다", count: 600 },
            { label: "낮다", count: 480 },
          ]}
          ctaLabel="댓글 보러가기"
          onCta={() => {
            const el = document.getElementById("comments");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

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

/** =========================
 *  LandingPage - 개선된 랜딩
 *  ========================= */
function LandingPage({ issues, onOpenIssue, onOpenChat, onOpenPollIssue, onNavigate }) {
  const [showAllReported, setShowAllReported] = useState(false);
  
  const reported = [
    { id: "corp-reorg", title: "대기업 C 구조조정", time: Date.now() - 3600000 * 2, curious: 127, threshold: 200 },
    { id: "politician-private", title: "정치인 D의 사적 모임", time: Date.now() - 3600000 * 5, curious: 89, threshold: 150 },
    { id: "celeb-scandal", title: "연예인 E 스캔들 증거", time: Date.now() - 3600000 * 8, curious: 215, threshold: 300 },
    { id: "tech-leak", title: "IT기업 F 신제품 유출", time: Date.now() - 3600000 * 12, curious: 56, threshold: 100 },
    { id: "startup-culture", title: "스타트업 G 직장 문화", time: Date.now() - 3600000 * 15, curious: 42, threshold: 80 },
    { id: "influencer-fake", title: "인플루언서 H 허위 광고", time: Date.now() - 3600000 * 18, curious: 98, threshold: 150 },
  ];

  const pastIssues = [
    { id: "past-1", title: "2024 연말 K-POP 시상식 뒷얘기", date: "2024.12.30", participants: 1250, views: 3420, comments: 156 },
    { id: "past-2", title: "대기업 신입 공채 내부 정보", date: "2024.12.15", participants: 890, views: 2100, comments: 78 },
    { id: "past-3", title: "유명 유튜버 협찬 논란", date: "2024.12.01", participants: 2100, views: 5600, comments: 289 },
    { id: "past-4", title: "배달앱 수수료 인상 사태", date: "2024.11.20", participants: 1560, views: 4200, comments: 203 },
    { id: "past-5", title: "부동산 시장 급변 예측", date: "2024.11.10", participants: 980, views: 2800, comments: 92 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-700 cursor-pointer" onClick={() => window.location.reload()}>비하인드</h1>
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => onNavigate && onNavigate("allIssues")}>전체 이슈</Button>
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">내 대화방</Button>
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">제보하기</Button>
            </nav>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">로그인</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        {/* 메인 컨텐츠 */}
        <section className="md:col-span-2 space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">지금 가장 뜨거운 토픽</h2>
            <p className="text-sm text-slate-600">실시간으로 가장 많은 관심을 받고 있는 이슈를 확인하세요</p>
          </div>

          {/* 이슈 목록 */}
          <div className="space-y-4">
            {issues.map((issue) => (
              <IssueCard 
                key={issue.id}
                issue={issue}
                onOpenIssue={onOpenIssue}
                onOpenChat={onOpenChat}
              />
            ))}
          </div>

          {/* 실시간 투표 */}
          <div className="relative mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50 shadow-sm">
            <div className="absolute -top-3 left-6 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-full shadow-md flex items-center gap-2 animate-pulse">
              <Flame className="w-4 h-4" />
              <span>실시간 투표 참여하기</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <QuickVote
                pollId="poll_sktkt_inside"
                question="SKT·KT 해킹, 내부자 개입이 있었을까?"
                options={[
                  { label: "그렇다", count: 600 },
                  { label: "아니다", count: 480 },
                ]}
                onCta={() => onOpenPollIssue("skt-kt-hack")}
              />
              <QuickVote
                pollId="poll_idol_contract"
                question="아이돌 A 계약 해지, 소속사 책임이 더 클까?"
                options={[
                  { label: "그렇다", count: 620 },
                  { label: "아니다", count: 410 },
                ]}
                onCta={() => onOpenPollIssue("idol-a-contract")}
              />
            </div>
          </div>

          {/* 지나간 이슈 */}
          <Card className="mt-8 bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">지나간 이슈</CardTitle>
              <p className="text-sm text-slate-500">과거 화제가 되었던 이슈들을 다시 살펴보세요</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastIssues.map((issue, idx) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-base text-slate-500 font-semibold flex-shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <p className="text-base text-slate-800 group-hover:text-indigo-600 transition-colors flex-1 font-semibold leading-snug">
                          {issue.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span className="font-medium">{issue.views.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-medium">{issue.comments.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 ml-8">{issue.date}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-slate-300 text-slate-700 hover:bg-slate-100">
                더 많은 이슈 보기
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* 사이드바 */}
        <aside className="space-y-6">
          {/* 실시간 인기 이슈 */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800">실시간 인기 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {[
                  { title: "SKT·KT 해킹 사건", change: 2, changeAmount: 1200 },
                  { title: "아이돌 A 계약 해지설", change: 1, changeAmount: 850 },
                  { title: "정치인 B 발언 논란", change: 0, changeAmount: 0 },
                  { title: "대기업 C 구조조정 루머", change: -1, changeAmount: 620 },
                  { title: "게임사 D 신작 유출", change: -3, changeAmount: 1500 }
                ].map((item, idx) => {
                  const formatChange = (num) => {
                    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                    return num.toString();
                  };

                  return (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors group">
                      <span className="text-slate-500 flex-shrink-0 font-bold w-6 text-base">{idx + 1}.</span>
                      <span className="flex-1 text-sm font-medium">{item.title}</span>
                      {item.change !== 0 && (
                        <div className={`flex items-center gap-1 flex-shrink-0 text-sm font-semibold ${
                          item.change > 0 ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {item.change > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          <span>{formatChange(item.changeAmount)}</span>
                        </div>
                      )}
                      {item.change === 0 && (
                        <span className="text-sm text-slate-400 flex-shrink-0">-</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* 제보된 이슈 */}
          <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800">제보된 이슈</CardTitle>
              <p className="text-xs text-slate-600">궁금해요 수가 목표치에 도달하면 공개됩니다</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reported.slice(0, showAllReported ? reported.length : 3).map((r) => {
                  const progress = Math.min((r.curious / r.threshold) * 100, 100);

                  return (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg bg-white border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors flex-1 leading-snug">{r.title}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs font-medium border-indigo-400 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-500 flex-shrink-0"
                        >
                          궁금해요
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{formatTime(r.time)}</span>
                          <span className="text-indigo-700 font-semibold">{r.curious}/{r.threshold}</span>
                        </div>
                        <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-3">
                {reported.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100"
                    onClick={() => setShowAllReported(!showAllReported)}
                  >
                    {showAllReported ? "접기" : `${reported.length - 3}개 더보기`}
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAllReported ? "rotate-180" : ""}`} />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className={`${reported.length > 3 ? 'flex-1' : 'w-full'} border-indigo-400 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-500`}
                >
                  전체보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        © 2025 비하인드. 모두의 뒷얘기 살롱.
      </footer>
    </div>
  );
}

/** =========================
 *  AllIssuesPage - 전체 이슈 페이지
 *  ========================= */
function AllIssuesPage({ allIssues, onOpenIssue, onOpenChat, onBack }) {
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [status, setStatus] = useState("all");

  const categories = [
    { value: "all", label: "전체" },
    { value: "politics", label: "정치" },
    { value: "economy", label: "경제" },
    { value: "entertainment", label: "연예" },
    { value: "tech", label: "IT/테크" },
    { value: "sports", label: "스포츠" },
    { value: "society", label: "사회" },
  ];

  const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "popular", label: "인기순" },
    { value: "comments", label: "댓글순" },
  ];

  const statusOptions = [
    { value: "all", label: "전체" },
    { value: "active", label: "입장 가능" },
    { value: "closed", label: "입장 불가" },
  ];

  // 필터링 로직
  let filteredIssues = [...allIssues];

  if (category !== "all") {
    filteredIssues = filteredIssues.filter((issue) => issue.category === category);
  }

  if (status === "active") {
    filteredIssues = filteredIssues.filter((issue) => issue.isActive);
  } else if (status === "closed") {
    filteredIssues = filteredIssues.filter((issue) => !issue.isActive);
  }

  // 정렬 로직
  if (sortBy === "latest") {
    filteredIssues.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortBy === "popular") {
    filteredIssues.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  } else if (sortBy === "comments") {
    filteredIssues.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
          </Button>
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">전체 이슈</h1>
            <p className="text-sm text-slate-600">모든 이슈를 카테고리별, 시간별로 탐색하세요</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 필터바 */}
        <Card className="mb-6 bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* 카테고리 칩 */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">카테고리</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                        category === cat.value
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 정렬 & 상태 */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* 정렬 드롭다운 */}
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">정렬</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {sortOptions.map((sort) => (
                      <option key={sort.value} value={sort.value}>
                        {sort.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 상태 탭 */}
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">상태</label>
                  <div className="inline-flex bg-slate-100 rounded-lg p-1 w-full">
                    {statusOptions.map((st) => (
                      <button
                        key={st.value}
                        onClick={() => setStatus(st.value)}
                        className={`flex-1 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          status === st.value
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이슈 리스트 */}
        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <Card className="bg-white border-slate-200">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">해당 조건에 맞는 이슈가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredIssues.map((issue) => (
              <Card key={issue.id} className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  {/* 썸네일 */}
                  {issue.thumbnail && (
                    <div className="w-full sm:w-48 h-48 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onOpenIssue(issue.id)}>
                      <ImageWithFallback
                        src={issue.thumbnail}
                        alt={issue.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* 콘텐츠 영역 */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-2">
                      {/* 제목과 상태 배지 */}
                      <div className="flex items-start gap-2">
                        <h3
                          className="text-lg font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors leading-snug line-clamp-2 flex-1"
                          onClick={() => onOpenIssue(issue.id)}
                        >
                          {issue.title}
                        </h3>
                        {!issue.isActive && (
                          <Badge variant="secondary" className="flex-shrink-0 text-xs bg-slate-200 text-slate-600">입장 불가</Badge>
                        )}
                      </div>

                      {/* 미리보기 */}
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{issue.preview}</p>

                      {/* 메타 정보 */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-medium text-slate-700">{issue.commentCount || 0}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span className="font-medium text-slate-700">{issue.participants}/{issue.capacity}</span>
                        </span>
                        {issue.liveViewers && issue.liveViewers > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium text-slate-700">{issue.liveViewers}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">{formatTime(issue.createdAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* 버튼 영역 */}
                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
                      <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100 flex-1 sm:flex-initial" onClick={() => onOpenIssue(issue.id)}>
                        자세히
                      </Button>
                      {issue.isActive && (
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-initial" onClick={() => onOpenChat(issue.id)}>
                          채팅 입장
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 페이지네이션 (추후 구현 가능) */}
        {filteredIssues.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              더 보기
            </Button>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        © 2025 비하인드. 모두의 뒷얘기 살롱.
      </footer>
    </div>
  );
}

/** =========================
 *  App - 메인 앱
 *  ========================= */
export default function App() {
  const [route, setRoute] = useState({ view: "home", issueId: null });
  const [showNickModal, setShowNickModal] = useState(false);
  const [pendingRoom, setPendingRoom] = useState(null);
  const [tempNick, setTempNick] = useState("");

  const allIssues = [
    {
      id: "skt-kt-hack",
      title: "2025 SKT·KT 해킹 사건",
      participants: 18,
      capacity: 30,
      preview: "보안 뚫린 이유가 내부자 때문이라는 얘기도 있다는데...",
      thumbnail: "https://images.unsplash.com/photo-1666875758376-25755544ba8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlciUyMHNlY3VyaXR5JTIwaGFja2luZ3xlbnwxfHx8fDE3NTk1NjM2MTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      upvotes: 234,
      commentCount: 47,
      liveViewers: 12,
      category: "tech",
      isActive: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      mediaEmbed: {
        youtube: "dQw4w9WgXcQ",
        news: [
          { title: "통신사 보안 사고 발생... 개인정보 유출 우려", source: "테크뉴스", url: "#" },
          { title: "전문가 \"내부자 개입 가능성 높아\"", source: "보안일보", url: "#" }
        ]
      }
    },
    {
      id: "idol-a-contract",
      title: "아이돌 A 계약 해지설",
      participants: 25,
      capacity: 30,
      preview: "팬들 사이에서는 사실 이미...",
      thumbnail: "https://images.unsplash.com/photo-1566477712363-3c75dd39b416?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrcG9wJTIwY29uY2VydCUyMHN0YWdlfGVufDF8fHx8MTc1OTQ0OTg4NHww&ixlib=rb-4.1.0&q=80&w=1080",
      upvotes: 187,
      commentCount: 92,
      liveViewers: 8,
      category: "entertainment",
      isActive: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 5
    },
    {
      id: "politician-b-scandal",
      title: "정치인 B 발언 논란, 진실은 무엇인가",
      participants: 30,
      capacity: 30,
      preview: "논란이 된 발언의 전후 맥락을 보면 다른 의미로 해석될 수 있다는 주장이...",
      thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1080",
      upvotes: 312,
      commentCount: 156,
      liveViewers: 0,
      category: "politics",
      isActive: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3
    },
    {
      id: "company-c-restructure",
      title: "대기업 C 구조조정 내부 정보",
      participants: 15,
      capacity: 30,
      preview: "특정 부서가 통폐합될 예정이라는 내부 제보가 있었습니다.",
      thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080",
      upvotes: 198,
      commentCount: 67,
      liveViewers: 15,
      category: "economy",
      isActive: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 12
    },
    {
      id: "sports-match-fixing",
      title: "프로야구 승부조작 의혹 제기",
      participants: 22,
      capacity: 30,
      preview: "특정 경기에서 이상한 플레이가 연속으로 발생했다는 증언이...",
      thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1080",
      upvotes: 276,
      commentCount: 203,
      liveViewers: 22,
      category: "sports",
      isActive: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 8
    },
    {
      id: "subway-accident",
      title: "지하철 사고 원인 분석",
      participants: 0,
      capacity: 30,
      preview: "시스템 오류인지 인적 오류인지에 대한 전문가 의견이 엇갈리고 있습니다.",
      thumbnail: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1080",
      upvotes: 89,
      commentCount: 34,
      liveViewers: 0,
      category: "society",
      isActive: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7
    },
    {
      id: "ai-copyright",
      title: "AI 창작물 저작권 논란, 어디까지 인정되어야 하나",
      participants: 12,
      capacity: 30,
      preview: "AI가 생성한 이미지의 저작권을 두고 법적 공방이 벌어지고 있습니다.",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1080",
      upvotes: 145,
      commentCount: 78,
      liveViewers: 12,
      category: "tech",
      isActive: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 18
    },
  ];

  const issues = allIssues.filter(issue => issue.isActive).slice(0, 2);

  const openIssue = (issueId) => setRoute({ view: "issue", issueId });

  const openChat = (roomId) => {
    setPendingRoom(roomId);
    const savedNick = getLS(nickKey(roomId), null);
    setTempNick(savedNick || randomNickname());
    setShowNickModal(true);
  };

  const confirmJoin = () => {
    if (!tempNick.trim()) return;
    setLS(nickKey(pendingRoom), tempNick.trim());
    setShowNickModal(false);
    const issue = issues.find((i) => i.id === pendingRoom) || issues[0];
    setRoute({ view: "chat", issueId: issue.id });
  };

  let screen = null;
  if (route.view === "allIssues") {
    screen = (
      <AllIssuesPage
        allIssues={allIssues}
        onOpenIssue={openIssue}
        onOpenChat={openChat}
        onBack={() => setRoute({ view: "home", issueId: null })}
      />
    );
  } else if (route.view === "issue") {
    const issue = allIssues.find((i) => i.id === route.issueId) || allIssues[0];
    screen = (
      <IssueDetailPage
        issue={issue}
        onBack={() => setRoute({ view: "home", issueId: null })}
        onJoinChat={() => openChat(issue.id)}
      />
    );
  } else if (route.view === "chat") {
    const issue = allIssues.find((i) => i.id === route.issueId) || allIssues[0];
    screen = (
      <ChatRoom
        roomId={issue.id}
        issueTitle={issue.title}
        participants={issue.participants}
        capacity={issue.capacity}
        onBack={() => setRoute({ view: "home", issueId: null })}
      />
    );
  } else {
    screen = (
      <LandingPage
        issues={issues}
        onOpenIssue={openIssue}
        onOpenChat={openChat}
        onOpenPollIssue={openIssue}
        onNavigate={(view) => setRoute({ view, issueId: null })}
      />
    );
  }

  return (
    <>
      {screen}

      {/* 닉네임 설정 모달 */}
      <Dialog open={showNickModal} onOpenChange={setShowNickModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>닉네임 설정</DialogTitle>
            <DialogDescription>
              이 채팅방에서 사용할 닉네임을 정해주세요. 방마다 다른 닉네임을 사용할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={tempNick}
              onChange={(e) => setTempNick(e.target.value)}
              placeholder="닉네임 입력"
              onKeyDown={(e) => e.key === "Enter" && confirmJoin()}
            />
            <Button 
              variant="outline" 
              onClick={() => setTempNick(randomNickname())}
              className="w-full"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              랜덤 생성
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNickModal(false)}>
              취소
            </Button>
            <Button onClick={confirmJoin} disabled={!tempNick.trim()}>
              입장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
