"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ArrowLeft, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  display_id: number;
  title: string;
  preview: string;
  category: string;
  created_at: string;
  view_count: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 검색 실행
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(
        `/api/issues?search=${encodeURIComponent(searchQuery)}&limit=50`
      );
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 검색 실행
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  // 검색 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      performSearch(query.trim());
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 검색 헤더 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">검색</h1>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이슈&뉴스 검색"
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
              autoFocus
            />
          </form>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
          </div>
        ) : hasSearched ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">&quot;{initialQuery}&quot;</span> 검색 결과{" "}
                <span className="font-medium text-slate-800">{results.length}</span>건
              </p>
            </div>

            {results.length > 0 ? (
              <ul className="space-y-3">
                {results.map((result) => (
                  <li key={result.id}>
                    <Link
                      href={`/issues/${result.display_id}`}
                      className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-slate-100"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0 font-medium">
                          {result.category}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-semibold text-slate-900 line-clamp-2 mb-1">
                            {result.title}
                          </h2>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                            {result.preview}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{formatDate(result.created_at)}</span>
                            <span>조회 {result.view_count.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-2">검색 결과가 없습니다</p>
                <p className="text-sm text-slate-400">
                  다른 검색어로 다시 시도해보세요
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-2">이슈와 뉴스를 검색해보세요</p>
            <p className="text-sm text-slate-400">
              관심 있는 키워드를 입력하면 관련 이슈를 찾아드립니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
