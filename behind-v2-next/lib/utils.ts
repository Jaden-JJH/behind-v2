import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** =========================
 *  Storage Helpers
 *  ========================= */
export const getLS = <T = unknown>(k: string, fallback: T | null = null): T | null => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};

export const setLS = (k: string, v: unknown): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

/** =========================
 *  Chat Helpers
 *  ========================= */
export const chatKey = (roomId: string): string => `bh_chat_${roomId}`;
export const nickKey = (roomId: string): string => `bh_nick_${roomId}`;

export function randomNickname(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `활동자${num}`;
}

/** =========================
 *  Time Formatting
 *  ========================= */
export const formatTime = (ts: number): string => {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};
