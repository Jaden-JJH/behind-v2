'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Users, Eye } from "lucide-react";
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
  participants: number;
  capacity: number;
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

  return (
    <Card className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
      <div className="flex gap-2 md:gap-4 p-3 md:p-4">
        {/* 썸네일 */}
        {issue.thumbnail && (
          <div className="w-24 h-16 md:w-48 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onOpenIssue(String(issue.display_id))}>
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
              className="text-base md:text-lg font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors leading-snug"
              onClick={() => onOpenIssue(String(issue.display_id))}
            >
              {issue.title}
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed line-clamp-2">{issue.preview}</p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">{issue.commentCount || 0}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-medium">{issue.participants}/{issue.capacity}</span>
              </span>
              {issue.viewCount && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">{issue.viewCount.toLocaleString()}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => onOpenIssue(String(issue.display_id))}>
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
