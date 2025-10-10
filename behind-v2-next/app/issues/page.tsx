'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Users, Eye, Clock } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { fetchIssues } from "@/lib/api-client";
import { formatTime } from "@/lib/utils";

export default function AllIssuesPage() {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [status, setStatus] = useState("all");
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API에서 이슈 데이터 가져오기
  useEffect(() => {
    async function loadIssues() {
      try {
        setLoading(true);
        const response = await fetchIssues();
        setIssues(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load issues:', err);
        setError('이슈를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    loadIssues();
  }, []);

  const categories = [
    { value: "all", label: "전체" },
    { value: "정치", label: "정치" },
    { value: "경제", label: "경제" },
    { value: "연예", label: "연예" },
    { value: "IT/테크", label: "IT/테크" },
    { value: "스포츠", label: "스포츠" },
    { value: "사회", label: "사회" },
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
  let filteredIssues = [...issues];
  
  if (category !== "all") {
    filteredIssues = filteredIssues.filter((issue) => issue.category === category);
  }
  
  if (status === "active") {
    filteredIssues = filteredIssues.filter((issue) => issue.status === 'active');
  } else if (status === "closed") {
    filteredIssues = filteredIssues.filter((issue) => issue.status !== 'active');
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-500">{error}</div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => router.push('/')} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
            <h1 className="text-xl font-bold">전체 이슈</h1>
            <div className="w-20" />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                  className="whitespace-nowrap"
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Sort and Status */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Issue List */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              해당하는 이슈가 없습니다.
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <Card
                key={issue.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/issues/${issue.display_id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex gap-3 p-3 md:p-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-16 md:w-32 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={issue.thumbnail || ''}
                        alt={issue.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm md:text-base line-clamp-1">
                          {issue.title}
                        </h3>
                        <Badge variant={issue.status === 'active' ? 'default' : 'secondary'}>
                          {issue.category}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2 md:mb-3">
                        {issue.preview}
                      </p>
                      <div className="flex items-center gap-2 md:gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {issue.capacity}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {issue.comment_count || 0}
                        </span>
                        {issue.view_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {issue.view_count.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
