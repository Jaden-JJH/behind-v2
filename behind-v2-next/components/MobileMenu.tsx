"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { showError } from "@/lib/toast-utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function MobileMenu({
  isOpen,
  onClose,
  user,
  onSignOut,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isMyPageExpanded, setIsMyPageExpanded] = useState(false);

  const isActive = (path: string) => pathname === path;
  const isMyPagePath = pathname.startsWith("/my");

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => setIsVisible(true));

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const handleReportClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      window.open(
        "https://forms.gle/xot7tw9vZ48uhChG7",
        "_blank",
        "noopener,noreferrer",
      );
      onClose();
    },
    [onClose],
  );

  const handleSignOutClick = useCallback(async () => {
    try {
      await onSignOut();
      onClose();
    } catch (error) {
      console.error("Failed to sign out", error);
      showError(error);
    }
  }, [onClose, onSignOut]);

  const handleMyPageLinkClick = () => {
    setIsMyPageExpanded(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        role="presentation"
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 h-full w-[280px] bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <nav className="flex h-full flex-col gap-2 py-6">
          <Link
            href="/issues"
            className="px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={onClose}
          >
            전체 이슈
          </Link>

          {/* 마이페이지 아코디언 */}
          <div>
            <button
              type="button"
              onClick={() => setIsMyPageExpanded(!isMyPageExpanded)}
              className={`w-full flex items-center justify-between px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100 ${
                isMyPagePath ? "text-indigo-700 font-medium" : ""
              }`}
            >
              <span>마이페이지</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isMyPageExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isMyPageExpanded && (
              <div className="bg-slate-50 space-y-1">
                <Link
                  href="/my"
                  onClick={handleMyPageLinkClick}
                  className={`block px-8 py-2 text-sm transition-colors ${
                    isActive("/my")
                      ? "text-indigo-700 font-medium bg-indigo-50"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🏠 대시보드
                </Link>
                <Link
                  href="/my/votes"
                  onClick={handleMyPageLinkClick}
                  className={`block px-8 py-2 text-sm transition-colors ${
                    isActive("/my/votes")
                      ? "text-indigo-700 font-medium bg-indigo-50"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🗳️ 참여한 투표
                </Link>
                <Link
                  href="/my/comments"
                  onClick={handleMyPageLinkClick}
                  className={`block px-8 py-2 text-sm transition-colors ${
                    isActive("/my/comments")
                      ? "text-indigo-700 font-medium bg-indigo-50"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  💬 내가 쓴 댓글
                </Link>
                <Link
                  href="/my/follows"
                  onClick={handleMyPageLinkClick}
                  className={`block px-8 py-2 text-sm transition-colors ${
                    isActive("/my/follows")
                      ? "text-indigo-700 font-medium bg-indigo-50"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  ⭐ 팔로우한 이슈
                </Link>
                <Link
                  href="/my/curious"
                  onClick={handleMyPageLinkClick}
                  className={`block px-8 py-2 text-sm transition-colors ${
                    isActive("/my/curious")
                      ? "text-indigo-700 font-medium bg-indigo-50"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  ❓ 궁금해요 누른 제보
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/my/chat-rooms"
            className="px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={onClose}
          >
            채팅방
          </Link>

          <a
            href="https://forms.gle/xot7tw9vZ48uhChG7"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={handleReportClick}
          >
            제보하기
          </a>

          {user ? (
            <div className="mt-auto px-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOutClick}
              >
                로그아웃
              </Button>
            </div>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
