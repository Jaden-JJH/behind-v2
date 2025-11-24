"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { NicknameModal } from "@/components/NicknameModal";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/MobileMenu";
import { showError } from "@/lib/toast-utils";

export function Header() {
  const { user, loading, signInWithGoogle, signOut, refreshUser } = useAuth();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const nickname = useMemo(() => {
    if (!user) return undefined;

    const metadataNickname =
      typeof user.user_metadata?.nickname === "string"
        ? (user.user_metadata.nickname as string)
        : undefined;

    if (metadataNickname) return metadataNickname;

    return typeof (user as { nickname?: unknown }).nickname === "string"
      ? ((user as { nickname?: string }).nickname ?? undefined)
      : undefined;
  }, [user]);

  useEffect(() => {
    if (loading) return;

    if (user && !nickname) {
      setShowNicknameModal(true);
      return;
    }

    setShowNicknameModal(false);
  }, [loading, user, nickname]);

  const handleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Failed to sign in with Google", error);
    }
  }, [signInWithGoogle]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setShowNicknameModal(false);
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  }, [signOut]);

  const handleNicknameSuccess = useCallback(async () => {
    setShowNicknameModal(false);
    await refreshUser();
    router.refresh();
  }, [router, refreshUser]);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 max-w-6xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden rounded-lg p-2 hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-700" />
            </button>

            <Link
              href="/"
              className="text-xl font-semibold text-gray-900 hover:text-gray-700"
            >
              Behind
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost">
              <Link href="/issues">전체 이슈</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/my">마이페이지</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => showError("준비중입니다")}
            >
              내 대화방
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                window.open(
                  "https://forms.gle/xot7tw9vZ48uhChG7",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              제보하기
            </Button>
          </nav>

          {/* 오른쪽: 로그인 또는 닉네임+로그아웃 */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {nickname ?? "닉네임 미설정"}
                </span>
                {/* 데스크탑에서만 로그아웃 버튼 표시 */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="hidden md:inline-flex"
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <Button onClick={handleSignIn} disabled={loading}>
                구글 로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onSignOut={handleSignOut}
      />

      <NicknameModal open={showNicknameModal} onSuccess={handleNicknameSuccess} />
    </>
  );
}
