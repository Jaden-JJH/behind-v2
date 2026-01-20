'use client'

import { Card } from "@/components/ui/card";
import { MessageCircle, Eye } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

/** =========================
 *  IssueCard - 레딧 스타일 이슈 카드
 *  ========================= */
interface Issue {
  id: string;
  display_id: number;
  title: string;
  preview: string;
  thumbnail?: string;
  upvotes?: number;
  commentCount?: number;
  viewCount?: number;
  participants?: number;
  capacity?: number;
  chat?: {
    activeMembers: number;
    capacity: number;
    isFull?: boolean;
  };
}

interface IssueCardProps {
  issue: Issue;
  onOpenIssue: (id: string) => void;
  onOpenChat: (id: string) => void;
}

export function IssueCard({ issue, onOpenIssue, onOpenChat }: IssueCardProps) {
  // 추후 투표 기능 구현 시 사용
  // const [upvotes, setUpvotes] = useState(issue.upvotes || 0);
  // const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const currentMembers =
    issue.chat?.activeMembers ??
    issue.participants ??
    0;
  const maxCapacity =
    issue.chat?.capacity ??
    issue.capacity ??
    0;
  const isFull = issue.chat?.isFull ?? (maxCapacity > 0 && currentMembers >= maxCapacity);

  return (
    <Card
      className="group bg-white border-slate-200 hover:border-slate-300 transition-all overflow-hidden cursor-pointer"
      onClick={() => onOpenIssue(String(issue.display_id))}
    >
      <div className="flex gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5">
        {/* 썸네일 */}
        <div className="w-36 h-28 sm:w-44 sm:h-32 md:w-48 md:h-36 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
          <ImageWithFallback
            src={issue.thumbnail}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors leading-snug line-clamp-2">
              {issue.title}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2">
              {issue.preview}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-3 sm:mt-auto pt-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{issue.commentCount || 0}</span>
            </span>
            {issue.viewCount !== undefined && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">{issue.viewCount.toLocaleString()}</span>
              </span>
            )}
            <span className="ml-auto text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
