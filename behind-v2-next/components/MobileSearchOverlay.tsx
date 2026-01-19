"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, X, Loader2 } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  display_id: number;
  title: string;
  preview: string;
  category: string;
}

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 열릴 때 인풋에 포커스 & 바디 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC 키 처리
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 검색 실행
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/issues?search=${encodeURIComponent(searchQuery)}&limit=10`
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

  // 디바운스 검색
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // 엔터 키로 검색 페이지 이동
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && query.trim()) {
        onClose();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router, onClose]
  );

  // 검색 결과 클릭
  const handleResultClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // 검색창 초기화
  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* 상단 검색 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center gap-2 px-3 h-16">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>

          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="이슈&뉴스 검색"
              className="w-full h-11 pl-10 pr-10 rounded-full border border-slate-300 bg-white text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-slate-800 transition-all shadow-sm"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
                ) : (
                  <X className="h-4 w-4 text-slate-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 검색 결과 또는 딤드 영역 */}
      <div
        className="flex-1 bg-black/50 overflow-y-auto"
        onClick={onClose}
        role="presentation"
      >
        {(query.trim() || results.length > 0) && (
          <div
            className="bg-white"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {results.length > 0 ? (
              <>
                <ul className="divide-y divide-slate-100">
                  {results.map((result) => (
                    <li key={result.id}>
                      <Link
                        href={`/issues/${result.display_id}`}
                        onClick={handleResultClick}
                        className="block px-4 py-3 active:bg-slate-50"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 shrink-0">
                            {result.category}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">
                              {result.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {result.preview}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleResultClick}
                  className="block px-4 py-3 text-center text-sm text-indigo-600 active:bg-indigo-50 border-t border-slate-100 font-medium"
                >
                  &quot;{query}&quot; 전체 검색 결과 보기
                </Link>
              </>
            ) : query.trim() && !isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                검색 결과가 없습니다
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
