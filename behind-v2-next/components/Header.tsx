"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { NicknameModal } from "@/components/NicknameModal";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/MobileMenu";
import { SearchBar } from "@/components/SearchBar";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { LoginDropdown } from "@/components/LoginDropdown";
import { showError } from "@/lib/toast-utils";

export function Header() {
  const { user, loading, signInWithGoogle, signInWithKakao, signOut, refreshUser } = useAuth();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isMyPage = pathname?.startsWith('/my') ?? false;

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
      showError(error);
    }
  }, [signInWithGoogle]);

  const handleKakaoSignIn = useCallback(async () => {
    try {
      await signInWithKakao();
    } catch (error) {
      console.error("Failed to sign in with Kakao", error);
      showError(error);
    }
  }, [signInWithKakao]);

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
        <div className={isMyPage ? "px-3 sm:px-4 md:px-6 flex h-16 items-center justify-between gap-4" : "mx-auto flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-6xl gap-4"}>
          {/* 좌측: 햄버거 메뉴 + 로고 */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              className="md:hidden rounded-lg p-2 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-700" />
            </button>

            <Link
              href="/"
              className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 hover:text-gray-700"
            >
              이슈위키
            </Link>
          </div>

          {/* 중앙: 네비게이션 (PC) */}
          <nav className="hidden items-center gap-1 md:flex shrink-0">
            <Button asChild variant="ghost" className="text-base font-semibold px-4 h-10">
              <Link href="/issues">전체 이슈</Link>
            </Button>
            <Button asChild variant="ghost" className="text-base font-semibold px-4 h-10">
              <Link href="/my">마이페이지</Link>
            </Button>
            <Button asChild variant="ghost" className="text-base font-semibold px-4 h-10">
              <Link href="/my/chat-rooms">채팅방</Link>
            </Button>
            <Button
              variant="ghost"
              className="text-base font-semibold px-4 h-10"
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

          {/* 우측: 검색 + 로그인 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PC 검색바 */}
            <SearchBar className="hidden md:block w-56 lg:w-72" />

            {/* 모바일 검색 버튼 */}
            <button
              type="button"
              className="md:hidden rounded-full p-2.5 bg-slate-800 hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors shadow-sm"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search className="h-5 w-5 text-yellow-400" />
            </button>

            {/* 로그인/사용자 정보 */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm font-medium text-gray-700">
                  {nickname ?? "닉네임 미설정"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden md:inline-flex min-h-[40px]"
                >
                  로그아웃
                </Button>
              </div>
            ) : (
              <>
                {/* PC 로그인 드롭다운 */}
                <div className="hidden md:block">
                  <LoginDropdown
                    onGoogleSignIn={handleSignIn}
                    onKakaoSignIn={handleKakaoSignIn}
                    loading={loading}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onSignOut={handleSignOut}
        onGoogleSignIn={handleSignIn}
        onKakaoSignIn={handleKakaoSignIn}
      />

      {/* 모바일 검색 오버레이 */}
      <MobileSearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      <NicknameModal open={showNicknameModal} onSuccess={handleNicknameSuccess} />
    </>
  );
}
