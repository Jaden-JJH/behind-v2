"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

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
  const [isVisible, setIsVisible] = useState(false);

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

  const handleMyRoomsClick = useCallback(() => {
    showError("준비중입니다");
    onClose();
  }, [onClose]);

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

          <button
            type="button"
            className="text-left px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100"
            onClick={handleMyRoomsClick}
          >
            내 대화방
          </button>

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
