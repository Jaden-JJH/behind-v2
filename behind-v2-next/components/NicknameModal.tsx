"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,20}$/;

type NicknameModalProps = {
  open: boolean;
  onSuccess: () => void;
};

type CheckNicknameResponse = {
  success: true;
  data: {
    available: boolean;
  };
};

type SetNicknameResponse = {
  success: true;
  data: {
    nickname: string;
    message: string;
  };
};

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "error";

export function NicknameModal({ open, onSuccess }: NicknameModalProps) {
  const [nickname, setNickname] = useState("");
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("idle");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const handleClose = async () => {
    try {
      await supabase.auth.signOut();
      toast.info("로그아웃되었습니다. 닉네임 설정 후 다시 로그인해주세요.");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("로그아웃에 실패했습니다");
    }
  };

  const isSubmitDisabled = useMemo(() => {
    if (!nickname) return true;
    if (validationError) return true;
    if (availability !== "available") return true;
    if (!termsAgreed) return true;
    return isSaving;
  }, [availability, isSaving, nickname, validationError, termsAgreed]);

  useEffect(() => {
    if (!nickname) {
      setValidationError(null);
      setAvailability("idle");
      return;
    }

    if (!NICKNAME_REGEX.test(nickname)) {
      setValidationError("2-20자의 한글, 영문, 숫자만 사용할 수 있습니다");
      setAvailability("idle");
      return;
    }

    setValidationError(null);
    setAvailability("checking");

    let isCancelled = false;
    const handler = setTimeout(async () => {
      try {
        const response = await apiClient<CheckNicknameResponse>(
          "/api/auth/check-nickname",
          {
            method: "POST",
            body: JSON.stringify({ nickname }),
          },
        );

        if (isCancelled) return;

        setAvailability(response.data.available ? "available" : "taken");
      } catch (error: any) {
        if (isCancelled) return;

        if (error?.code === "NICKNAME_TAKEN") {
          setAvailability("taken");
        } else if (error?.code === "NICKNAME_INVALID") {
          setAvailability("idle");
          setValidationError(
            "2-20자의 한글, 영문, 숫자만 사용할 수 있습니다",
          );
        } else {
          console.error("Nickname check failed", error);
          setAvailability("error");
          toast.error("닉네임 중복 확인에 실패했습니다");
        }
      }
    }, 500);

    return () => {
      isCancelled = true;
      clearTimeout(handler);
    };
  }, [nickname]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value);
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isSubmitDisabled) return;

    setIsSaving(true);
    try {
      await apiClient<SetNicknameResponse>(
        "/api/auth/set-nickname",
        {
          method: "POST",
          body: JSON.stringify({
            nickname,
            termsAgreed: true,
            privacyAgreed: true,
          }),
        },
      );

      toast.success("닉네임이 설정되었습니다");

      setNickname("");
      setAvailability("idle");
      setValidationError(null);
      setTermsAgreed(false);

      onSuccess();
    } catch (error: any) {
      console.error("Failed to set nickname", error);

      if (error?.code === "NICKNAME_TAKEN") {
        setAvailability("taken");
        toast.error("이미 사용 중인 닉네임입니다");
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("닉네임 설정에 실패했습니다");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>닉네임 설정</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Behind에서 사용할 닉네임을 설정해주세요
          </p>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Input
              value={nickname}
              onChange={handleChange}
              placeholder="2-20자, 한글/영문/숫자만 가능"
              aria-invalid={
                Boolean(validationError) || availability === "taken"
              }
              maxLength={20}
              autoComplete="off"
            />

            {validationError ? (
              <p className="text-sm text-destructive">{validationError}</p>
            ) : availability === "available" ? (
              <p className="text-sm text-emerald-600">사용 가능한 닉네임입니다</p>
            ) : availability === "taken" ? (
              <p className="text-sm text-destructive">
                이미 사용 중인 닉네임입니다
              </p>
            ) : availability === "checking" ? (
              <p className="text-sm text-muted-foreground">중복 확인 중...</p>
            ) : availability === "error" ? (
              <p className="text-sm text-destructive">
                중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsAgreed}
                onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="terms"
                className="text-sm leading-tight cursor-pointer select-none"
              >
                (필수) 이용약관 및 개인정보처리방침에 모두 동의합니다
              </label>
            </div>

            <div className="flex gap-2 text-sm pl-6">
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground underline"
              >
                이용약관
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground underline"
              >
                개인정보처리방침
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
