"use client";

import { Send, Sparkles } from "lucide-react";

export function ReportBanner() {
  const handleReportClick = () => {
    window.open(
      "https://forms.gle/xot7tw9vZ48uhChG7",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
      <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl px-6 sm:px-8 md:px-10 py-5 sm:py-5.5 md:py-6 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          {/* 왼쪽: 텍스트 */}
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold text-white/90 tracking-wide">
                당신의 이야기를 들려주세요
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
              월 7,000명이 함께하는 이슈 토론, <span className="text-yellow-300">비하인드</span>
            </h3>
          </div>

          {/* 오른쪽: 버튼 */}
          <div className="flex items-center">
            <button
              onClick={handleReportClick}
              className="group bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-base px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              지금 제보하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
