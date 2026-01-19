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
      className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden cursor-pointer sm:cursor-default"
      onClick={() => onOpenIssue(String(issue.display_id))}
    >
      <div className="flex gap-3 sm:gap-3.5 md:gap-4 p-4 sm:p-4.5 md:p-5">
        {/* 썸네일 */}
        <div className="w-40 h-32 sm:w-44 sm:h-36 md:w-48 md:h-36 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
          <ImageWithFallback
            src={issue.thumbnail}
            alt={issue.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>

        {/* 콘텐츠 영역 - min-w-0 추가로 flex shrink 허용 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 sm:hover:text-slate-700 transition-colors leading-snug line-clamp-2">
              {issue.title}
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2">{issue.preview}</p>
          </div>

          <div className="flex items-center justify-end gap-4 sm:gap-5 mt-3 sm:mt-4">
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <span className="text-sm sm:text-base font-semibold text-slate-500">{issue.commentCount || 0}</span>
            </span>
            {issue.viewCount !== undefined && (
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <span className="text-sm sm:text-base font-semibold text-slate-500">{issue.viewCount.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
