"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, CircleUser } from "lucide-react";
import Image from "next/image";

import { useAuth } from "@/hooks/useAuth";
import { NicknameModal } from "@/components/NicknameModal";
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
        <div className={isMyPage ? "px-3 sm:px-4 md:px-6 flex h-16 items-center justify-between gap-3" : "mx-auto flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-6xl gap-3"}>
          {/* 좌측: 햄버거 메뉴 + 로고 */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              className="md:hidden rounded-lg p-2 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6 text-slate-700" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-base sm:text-lg md:text-xl font-semibold text-gray-900 hover:text-gray-700 shrink-0"
            >
              <Image
                src="/favicon.svg"
                alt="이슈위키"
                width={24}
                height={24}
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              이슈위키
            </Link>
          </div>

          {/* PC 검색바 - 중앙 배치 */}
          <div className="hidden md:flex flex-1 justify-center">
            <SearchBar className="w-full max-w-md" />
          </div>

          {/* 우측: 모바일 검색 + 로그인/마이페이지 */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 모바일 검색 버튼 - 인풋박스 스타일 */}
            <button
              type="button"
              className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">이슈 검색</span>
            </button>

            {/* 로그인/마이페이지 */}
            {user ? (
              <Link
                href="/my"
                className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <span className="hidden md:inline text-base font-medium text-slate-700 group-hover:text-indigo-700">
                  {nickname ?? "닉네임 미설정"}
                </span>
                <CircleUser className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700" />
              </Link>
            ) : (
              /* PC에서만 로그인 버튼 표시 - 모바일은 햄버거 메뉴에서 로그인 */
              <div className="hidden md:block">
                <LoginDropdown
                  onGoogleSignIn={handleSignIn}
                  onKakaoSignIn={handleKakaoSignIn}
                  loading={loading}
                />
              </div>
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
