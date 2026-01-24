"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const LOGIN_PROVIDERS = [
  { name: "google", logo: "/google-logo.png", alt: "Google" },
  { name: "kakao", logo: "/kakao-logo.png", alt: "Kakao" },
];

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
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 로고 로테이션 (3초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentLogoIndex((prev) => (prev + 1) % LOGIN_PROVIDERS.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        {/* 로고 로테이션 영역 */}
        <div className="relative w-6 h-6 overflow-hidden">
          {LOGIN_PROVIDERS.map((provider, index) => (
            <div
              key={provider.name}
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                index === currentLogoIndex
                  ? isAnimating
                    ? "-translate-y-full opacity-0"
                    : "translate-y-0 opacity-100"
                  : index === (currentLogoIndex + 1) % LOGIN_PROVIDERS.length
                  ? isAnimating
                    ? "translate-y-0 opacity-100"
                    : "translate-y-full opacity-0"
                  : "translate-y-full opacity-0"
              }`}
            >
              <Image
                src={provider.logo}
                alt={provider.alt}
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
          ))}
        </div>
        <span className="text-base font-medium text-slate-700">로그인</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

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
