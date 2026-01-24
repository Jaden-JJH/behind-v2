'use client'
import { handleApiResponse } from '@/lib/toast-utils';
import { csrfFetch } from '@/lib/csrf-client';
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { LoginPrompt } from '@/components/LoginPrompt';
import { ReportModal } from '@/components/ReportModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Flag, AlertTriangle } from "lucide-react";
import { generateUUID } from '@/lib/uuid';

/** =========================
 *  Utils
 *  ========================= */
const toSafeNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeOptions = (options: Array<{id?: string, label?: string, count?: number}>): Array<{id: string, label: string, count: number}> => {
  const arr = Array.isArray(options) ? options.filter(Boolean) : [];
  const filled = arr.map((o, i) => ({ id: o.id ?? `temp-${i}`, label: o.label ?? `옵션 ${i + 1}`, count: toSafeNumber(o.count) }));
  while (filled.length < 2) filled.push({ id: `temp-${filled.length}`, label: `옵션 ${filled.length + 1}`, count: 0 });
  return filled.slice(0, 2);
};

const initCountsFromOptions = (options: Array<{label?: string, count?: number}>): number[] => normalizeOptions(options).map((o) => toSafeNumber(o.count));

const incrementAtIndex = (arr: number[], idx: number): number[] => {
  const base = Array.isArray(arr) ? Array.from(arr) : [];
  const i = Number(idx);
  if (!Number.isInteger(i) || i < 0 || i >= base.length) return base;
  base[i] = toSafeNumber(base[i]) + 1;
  return base;
};

// Storage helpers
const voteKey = (pollId: string): string => `bh_voted_${encodeURIComponent(pollId)}`;

const getStoredVote = (pollId: string): number | null => {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(voteKey(pollId));
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
};

const setStoredVote = (pollId: string, idx: number): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(voteKey(pollId), String(idx));
  } catch {}
};

// Device hash 생성
const getDeviceHash = (): string => {
  if (typeof window === "undefined") return "";
  let hash = localStorage.getItem('bh_device_hash');
  if (!hash) {
    hash = generateUUID();
    localStorage.setItem('bh_device_hash', hash);
  }
  return hash;
};

// 투표 횟수 관리
const VOTE_COUNT_KEY = 'bh_vote_count';

const getVoteCount = (): number => {
  if (typeof window === "undefined") return 0;
  try {
    const count = localStorage.getItem(VOTE_COUNT_KEY);
    return count ? Number.parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
};

const incrementVoteCount = (): number => {
  if (typeof window === "undefined") return 0;
  try {
    const current = getVoteCount();
    const newCount = current + 1;
    localStorage.setItem(VOTE_COUNT_KEY, String(newCount));
    return newCount;
  } catch {
    return 0;
  }
};

const resetVoteCount = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(VOTE_COUNT_KEY);
  } catch {}
};

/** =========================
 *  QuickVote - 투표 컴포넌트
 *  ========================= */
interface QuickVoteProps {
  pollId: string;
  question: string;
  options: Array<{id: string, label: string, count: number}>;
  ctaLabel?: string;
  onCta?: () => void;
  isBlinded?: boolean;
  blindedAt?: string;
}

export function QuickVote({ pollId, question, options, ctaLabel = "이슈 자세히 보기", onCta, isBlinded, blindedAt }: QuickVoteProps) {
  const { user, signInWithGoogle } = useAuth();
  const safeOptions = useMemo(() => normalizeOptions(options), [options]);
  const [counts, setCounts] = useState(() => initCountsFromOptions(safeOptions));
  const [selected, setSelected] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const saved = getStoredVote(pollId || question || "");
    if (saved != null && Number.isInteger(saved)) {
      setSelected(saved);
      setVoted(true);
    }
  }, [pollId, question]);

  // 로그인 시 투표 카운트 초기화
  useEffect(() => {
    if (user) {
      resetVoteCount();
    }
  }, [user]);

  const total = (Array.isArray(counts) ? counts : []).reduce((a, b) => toSafeNumber(a) + toSafeNumber(b), 0);

  const handleVote = async (idx: number) => {
    if (voted) return;

    // 비로그인 사용자: 투표 횟수 체크
    if (!user) {
      const currentCount = getVoteCount();
      
      // 3번째 투표부터 로그인 팝업 표시
      if (currentCount >= 2) {
        setShowLoginPrompt(true);
        // 팝업 표시 후에도 투표는 진행 (옵션 A 정책)
      }
    }

    const selectedOption = safeOptions[idx];
    const cleanPollId = pollId.replace(/^poll_/, '');

    try {
      // API 호출
      const response = await csrfFetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: cleanPollId,
          optionId: selectedOption?.id,
          deviceHash: getDeviceHash()
        })
      });

      // 공통 응답 핸들러 사용 (429 에러 자동 처리)
      await handleApiResponse(response);

      // 성공 시 로컬 상태 업데이트
      setCounts((prev) => incrementAtIndex(prev, idx));
      setSelected(idx);
      setVoted(true);
      setStoredVote(pollId || question || "", idx);

      // 비로그인 사용자: 투표 카운트 증가 (최대 3까지)
      if (!user) {
        const currentCount = getVoteCount();
        if (currentCount < 3) {
          incrementVoteCount();
        }
      }

    } catch (error: any) {
      // handleApiResponse에서 이미 토스트 표시됨
      // 중복 투표는 409 에러로 처리됨
      console.error('투표 API 오류:', error);
    }
  };

  return (
    <>
      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        voteCount={getVoteCount()}
      />

      <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden gap-0">
        <CardHeader className="py-3 bg-gradient-to-b from-slate-100 to-slate-50/80">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-800 leading-snug line-clamp-2">{question}</CardTitle>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                {toSafeNumber(total).toLocaleString()}명 참여 중
              </span>
            </div>
            {!isBlinded && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setReportModalOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    신고하기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2 bg-white">
          {isBlinded ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-yellow-700">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <p className="font-medium mb-1">블라인드 처리된 투표입니다</p>
                  <p className="text-sm text-yellow-600">
                    이 투표는 신고 누적으로 인해 관리자에 의해 블라인드 처리되었습니다.
                  </p>
                  {blindedAt && (
                    <p className="text-xs text-yellow-600 mt-1">
                      처리 시간: {new Date(blindedAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : !voted ? (
            <div className="space-y-1.5">
              {safeOptions.map((option, idx) => {
                return (
                  <button
                    key={option.id || idx}
                    onClick={() => handleVote(idx)}
                    className="w-full group relative overflow-hidden rounded-lg bg-slate-50 px-4 py-3 text-left transition-all duration-200 hover:bg-yellow-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center transition-all group-hover:bg-yellow-400">
                        <span className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-white">
                          {idx === 0 ? 'A' : 'B'}
                        </span>
                      </span>
                      <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                        {option.label}
                      </span>
                    </div>
                  </button>
                )
              })}
              {onCta && (
                <button
                  onClick={onCta}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {safeOptions.map((o, idx) => {
                const c = toSafeNumber(counts?.[idx]);
                const t = Math.max(1, toSafeNumber(total));
                const pct = Math.round((c / t) * 100);
                const chosen = selected === idx;
                return (
                  <div
                    key={`res-${idx}`}
                    className={`rounded-lg px-4 py-3 transition-all ${
                      chosen ? "bg-yellow-50" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                          chosen
                            ? 'bg-yellow-400 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {idx === 0 ? 'A' : 'B'}
                        </span>
                        <span className={`${chosen ? "text-slate-900 font-semibold" : "text-slate-600 font-medium"}`}>
                          {o.label}
                        </span>
                      </div>
                      <span className={`${chosen ? "text-yellow-600 font-bold" : "text-slate-500 font-medium"} tabular-nums text-sm`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {onCta && (
                <button
                  onClick={onCta}
                  className="w-full rounded-lg bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        contentType="poll"
        contentId={pollId.replace(/^poll_/, '')}
      />
    </>
  );
}
