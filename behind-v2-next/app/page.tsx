'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Eye, TrendingUp, ArrowDown, ChevronDown, Flame } from "lucide-react";
import { IssueCard } from "@/components/issue-card";
import { QuickVote } from "@/components/quick-vote";
import { fetchIssues, fetchReports, curiousReport } from "@/lib/api-client";
import { formatTime, formatDate } from "@/lib/utils";
import { getDeviceHash } from "@/lib/device-hash";

export default function LandingPage() {
  const [showAllReported, setShowAllReported] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [pastIssues, setPastIssues] = useState<any[]>([]);
  const [trendingIssues, setTrendingIssues] = useState<any[]>([]);
  const [reportedIssues, setReportedIssues] = useState<any[]>([]);
  const [curiousLoading, setCuriousLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIssues() {
      try {
        const response = await fetchIssues();
        const activeIssues = response.data.filter(issue => issue.status === "active").slice(0, 2);
        setIssues(activeIssues);

        // 투표 데이터 로드
        const pollIssues = response.data.filter(issue => {
          console.log('Issue check:', {
            display_id: issue.display_id,
            status: issue.status,
            show_in_main_poll: issue.show_in_main_poll,
            has_poll: !!issue.poll
          });

          return issue.status === "active" &&
                 issue.show_in_main_poll === true &&
                 issue.poll;
        }).slice(0, 2);

        console.log('Filtered poll issues:', pollIssues);
        setPolls(pollIssues);

        // 지나간 이슈 데이터 (전체 active 이슈 중 최신순 5개)
        const pastResponse = await fetchIssues({ includeAll: true, limit: 5 });
        const pastData = pastResponse.data.map(issue => ({
          id: String(issue.display_id),
          title: issue.title,
          date: formatDate(issue.created_at),
          views: issue.view_count || 0,
          comments: issue.comment_count || 0
        }));
        setPastIssues(pastData);
        // 실시간 인기 이슈 (조회수 상위 5개)
        const trendingResponse = await fetchIssues({ includeAll: true, limit: 100 });
        const trendingData = trendingResponse.data
          .filter(issue => issue.status === 'active')
          .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 5)
          .map(issue => ({
            id: String(issue.display_id),
            title: issue.title,
            change: 0,
            changeAmount: 0
          }));
        setTrendingIssues(trendingData);

        // 제보된 이슈 로드
        const reportsResponse = await fetchReports({ status: 'active' });
        const shuffled = reportsResponse.data.sort(() => 0.5 - Math.random());
        setReportedIssues(shuffled.slice(0, 3));
      } catch (err) {
        console.error("Failed to load issues:", err);
      } finally {
        setLoading(false);
      }
    }
    loadIssues();
  }, []);

  const handleCurious = async (reportId: string) => {
    setCuriousLoading(prev => ({ ...prev, [reportId]: true }));

    try {
      const deviceHash = getDeviceHash();
      await curiousReport(reportId, deviceHash);

      alert('궁금한 이슈, 공개되면 알려드릴게요.');

      // 다시 로드
      const reportsResponse = await fetchReports({ status: 'active' });
      const shuffled = reportsResponse.data.sort(() => 0.5 - Math.random());
      setReportedIssues(shuffled.slice(0, 3));
    } catch (err: any) {
      if (err.status === 409 || err.code === 'ALREADY_CURIOUS') {
        alert('이미 궁금해요를 누르셨습니다.');
      } else if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
        alert('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.');
      } else {
        console.error('Curious error:', err);
        alert('오류가 발생했습니다.');
      }
    } finally {
      setCuriousLoading(prev => ({ ...prev, [reportId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <h1 className="text-3xl font-bold tracking-tight text-slate-700 cursor-pointer">비하인드</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/issues">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">전체 이슈</Button>
              </Link>
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">내 대화방</Button>
              <Button 
                variant="ghost" 
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => window.open('https://forms.gle/xot7tw9vZ48uhChG7', '_blank', 'noopener,noreferrer')}
              >
                제보하기
              </Button>
            </nav>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">로그인</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6 grid md:grid-cols-3 gap-4 md:gap-6">
        {/* 메인 컨텐츠 */}
        <section className="md:col-span-2 space-y-4 md:space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">지금 가장 뜨거운 토픽</h2>
            <p className="text-sm text-slate-600">실시간으로 가장 많은 관심을 받고 있는 이슈를 확인하세요</p>
          </div>

          {/* 이슈 목록 */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8">표시할 이슈가 없습니다.</div>
            ) : (
              issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={{
                    ...issue,
                    commentCount: issue.comment_count,
                    viewCount: issue.view_count
                  }}
                  onOpenIssue={(display_id) => window.location.href = `/issues/${display_id}`}
                  onOpenChat={(id) => window.location.href = `/chat/${id}`}
                />
              ))
            )}
          </div>

          {/* 실시간 투표 */}
          {polls.length > 0 && (
            <div className="relative mt-6 md:mt-8 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50 shadow-sm">
              <div className="absolute -top-3 left-6 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-full shadow-md flex items-center gap-2 animate-pulse">
                <Flame className="w-4 h-4" />
                <span>실시간 투표 참여하기</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3">
                {polls.map((issue) => {
                  // poll이 배열로 온 경우 첫 번째 요소 사용
                  const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll;

                  // poll이나 options가 없으면 null 반환
                  if (!poll || !poll.options || !Array.isArray(poll.options)) {
                    return null;
                  }

                  return (
                    <QuickVote
                      key={poll.id}
                      pollId={poll.id}
                      question={poll.question || issue.title}
                      options={poll.options.map((opt: any) => ({
                        id: opt.id,
                        label: opt.label,
                        count: opt.vote_count
                      }))}
                      onCta={() => window.location.href = `/issues/${issue.display_id}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

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
                    onClick={() => window.location.href = `/issues/${issue.id}`}
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
              <Button variant="outline" className="w-full mt-4 border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => window.location.href = '/issues'}>
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
                {trendingIssues.map((item, idx) => {
                  const formatChange = (num: number) => {
                    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                    return num.toString();
                  };

                  return (
                    <li
                      key={item.id}
                      onClick={() => window.location.href = `/issues/${item.id}`}
                      className="flex items-start gap-2.5 text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors group"
                    >
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
                {reportedIssues.slice(0, showAllReported ? reportedIssues.length : 3).map((r) => {
                  const progress = Math.min((r.curious_count / r.threshold) * 100, 100);

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
                          onClick={() => handleCurious(r.id)}
                          disabled={curiousLoading[r.id]}
                          className="h-7 text-xs font-medium border-indigo-400 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-500 flex-shrink-0"
                        >
                          {curiousLoading[r.id] ? '...' : '궁금해요'}
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{formatTime(new Date(r.created_at).getTime())}</span>
                          <span className="text-indigo-700 font-semibold">{r.curious_count}/{r.threshold}</span>
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
                {reportedIssues.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100"
                    onClick={() => setShowAllReported(!showAllReported)}
                  >
                    {showAllReported ? "접기" : `${reportedIssues.length - 3}개 더보기`}
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAllReported ? "rotate-180" : ""}`} />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/reported-issues'}
                  className={`${reportedIssues.length > 3 ? 'flex-1' : 'w-full'} border-indigo-400 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-500`}
                >
                  전체보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        Copyright © 2025 by Behind
      </footer>
    </div>
  );
}
