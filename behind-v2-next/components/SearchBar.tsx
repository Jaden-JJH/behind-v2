"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, X, Loader2 } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  display_id: number;
  title: string;
  preview: string;
  category: string;
}

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 실행
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/issues?search=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
        setIsOpen(true);
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
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [query, router]
  );

  // 검색 결과 클릭
  const handleResultClick = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  // 검색창 초기화
  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-700 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          placeholder="이슈&뉴스 검색"
          className="w-full h-10 pl-10 pr-20 rounded-full border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-slate-800 transition-all shadow-sm hover:border-slate-400"
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
          <div className="flex items-center justify-center w-7 h-7 bg-slate-800 rounded-full">
            <CornerDownLeft className="h-3.5 w-3.5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {results.length > 0 ? (
            <>
              <ul className="divide-y divide-slate-100">
                {results.map((result) => (
                  <li key={result.id}>
                    <Link
                      href={`/issues/${result.display_id}`}
                      onClick={handleResultClick}
                      className="block px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 shrink-0">
                          {result.category}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
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
                className="block px-4 py-2.5 text-center text-sm text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 font-medium"
              >
                &quot;{query}&quot; 전체 검색 결과 보기
              </Link>
            </>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
