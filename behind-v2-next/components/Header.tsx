"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { NicknameModal } from "@/components/NicknameModal";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, loading, signInWithGoogle, signOut, refreshUser } = useAuth();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
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
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-semibold text-gray-900 hover:text-gray-700"
          >
            Behind
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {nickname ?? "닉네임 미설정"}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
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

      <NicknameModal open={showNicknameModal} onSuccess={handleNicknameSuccess} />
    </>
  );
}
