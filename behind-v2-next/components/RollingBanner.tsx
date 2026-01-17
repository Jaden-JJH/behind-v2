'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface BannerIssue {
  id: string
  display_id: number
  title: string
  position: number
}

interface RollingBannerProps {
  issues: BannerIssue[]
}

export function RollingBanner({ issues }: RollingBannerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)

  // 이슈가 없으면 렌더링하지 않음
  if (!issues || issues.length === 0) {
    return null
  }

  // 1개만 있으면 롤링 없이 정적으로 표시
  const shouldRoll = issues.length > 1

  useEffect(() => {
    if (!shouldRoll) return

    // 2초마다 다음 인덱스로 변경
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % issues.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [shouldRoll, issues.length])

  const currentIssue = issues[currentIndex]

  const handleClick = () => {
    router.push(`/issues/${currentIssue.display_id}`)
  }

  return (
    <div
      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white cursor-pointer hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 transition-colors"
      onClick={handleClick}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
          {/* 속보 배지 */}
          <span className="flex-shrink-0 px-2 py-0.5 bg-white/90 text-indigo-600 text-xs font-bold rounded uppercase tracking-wide shadow-sm">
            Breaking
          </span>

          {/* 타이틀 (슬롯머신 롤링 애니메이션) */}
          <div className="flex-1 min-w-0 overflow-hidden relative h-6">
            <div
              key={currentIndex}
              className="absolute inset-0 flex items-center animate-slot-roll"
            >
              <p className="text-sm sm:text-base font-semibold truncate w-full">
                {currentIssue.title}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
