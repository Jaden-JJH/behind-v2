"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginDropdownProps {
  onGoogleSignIn: () => Promise<void>;
  onKakaoSignIn: () => Promise<void>;
  loading?: boolean;
}

export function LoginDropdown({
  onGoogleSignIn,
  onKakaoSignIn,
  loading = false,
}: LoginDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleGoogleClick = async () => {
    setIsOpen(false);
    await onGoogleSignIn();
  };

  const handleKakaoClick = async () => {
    setIsOpen(false);
    await onKakaoSignIn();
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-1.5 min-h-[40px] px-4"
      >
        <span className="text-sm">로그인</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
          >
            <Image
              src="/google-logo.png"
              alt="Google"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-slate-700">
              Google로 로그인
            </span>
          </button>
          <button
            type="button"
            onClick={handleKakaoClick}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FEE500]/20 transition-colors text-left border-t border-slate-100"
          >
            <Image
              src="/kakao-logo.png"
              alt="Kakao"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium text-slate-700">
              카카오로 로그인
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
