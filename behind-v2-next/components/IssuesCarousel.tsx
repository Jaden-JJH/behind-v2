'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselIssue {
  id: string
  display_id: number
  title: string
  preview: string
  thumbnail: string | null
  position: number
}

interface IssuesCarouselProps {
  issues: CarouselIssue[]
}

export function IssuesCarousel({ issues }: IssuesCarouselProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(1) // 무한 캐러셀: 1부터 시작 (첫 복제본 건너뛰기)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const hasIssues = issues && issues.length > 0

  // 무한 루프 처리: transition 후 경계 체크
  useEffect(() => {
    if (!isTransitioning || !hasIssues) return

    const timer = setTimeout(() => {
      setIsTransitioning(false)

      // 마지막 복제본에 도달 → 첫 실제 아이템으로 순간이동
      if (currentIndex === issues.length + 1) {
        setCurrentIndex(1)
      }
      // 첫 복제본에 도달 → 마지막 실제 아이템으로 순간이동
      if (currentIndex === 0) {
        setCurrentIndex(issues.length)
      }
    }, 500) // transition duration과 동일

    return () => clearTimeout(timer)
  }, [currentIndex, isTransitioning, hasIssues, issues])

  // 5초마다 자동 재생 (호버 시 일시정지)
  useEffect(() => {
    if (isHovered || !hasIssues || issues.length <= 1) return

    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [isHovered, hasIssues, issues])

  // 모바일 터치 시 화살표 표시 (3초 후 숨김)
  useEffect(() => {
    if (!isTouched) return

    const timeout = setTimeout(() => {
      setIsTouched(false)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [isTouched])

  const handlePrevious = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
  }, [isTransitioning])

  const handleNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
  }, [isTransitioning])

  const handleDotClick = useCallback((index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index + 1) // +1: 복제본 오프셋
  }, [isTransitioning])

  const handleIssueClick = useCallback((displayId: number) => {
    router.push(`/issues/${displayId}`)
  }, [router])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTouched(true)
    const touchX = e.targetTouches[0].clientX
    setTouchStartX(touchX)
    setTouchEndX(touchX) // 시작 위치로 초기화
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (isTransitioning) return

    const swipeDistance = touchStartX - touchEndX
    const minSwipeDistance = 100 // 최소 스와이프 거리 증가 (75 → 100)

    // 실제로 충분히 움직였을 때만 스와이프로 인식
    if (Math.abs(swipeDistance) < minSwipeDistance) {
      return
    }

    if (swipeDistance > 0) {
      // 왼쪽으로 스와이프 (다음)
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev + 1)
    } else {
      // 오른쪽으로 스와이프 (이전)
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev - 1)
    }
  }

  // 무한 캐러셀을 위한 복제 배열: [마지막, ...원본, 첫번째]
  const extendedIssues = hasIssues ? [issues[issues.length - 1], ...issues, issues[0]] : []

  // PC: 3개씩 보이는 인덱스 계산
  const getVisibleIssuesForDesktop = () => {
    if (!hasIssues) return []
    const actualIndex = currentIndex === 0 ? issues.length - 1 :
                       currentIndex === issues.length + 1 ? 0 :
                       currentIndex - 1
    const result = []
    for (let i = 0; i < 3; i++) {
      const index = (actualIndex + i) % issues.length
      result.push(issues[index])
    }
    return result
  }

  if (!hasIssues) {
    return null
  }

  return (
    <div
      className="relative w-full bg-slate-50 pt-2 md:pt-6"
    >
      {/* PC 버전: 3개씩 보이는 그리드 */}
      <div
        className="hidden md:block overflow-hidden relative max-w-6xl mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="grid grid-cols-3 gap-8 px-6 py-6 transition-all duration-700 ease-in-out h-[405px]"
          key={currentIndex === 0 ? issues.length - 1 : currentIndex === issues.length + 1 ? 0 : currentIndex - 1}
        >
          {getVisibleIssuesForDesktop().map((issue, idx) => (
            <div
              key={`${issue.id}-${idx}`}
              className={`cursor-pointer transition-all duration-500 animate-fade-in ${
                idx === 1 ? 'transform scale-110 text-center' : 'opacity-90'
              }`}
              onClick={() => handleIssueClick(issue.display_id)}
            >
              {/* 썸네일 */}
              <div className={`relative w-full aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden ${
                idx === 1 ? 'mb-4' : 'mb-3'
              }`}>
                {issue.thumbnail ? (
                  <img
                    src={issue.thumbnail}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* 제목 */}
              <h3 className={`font-bold mb-2 line-clamp-2 ${
                idx === 1 ? 'text-xl' : 'text-base'
              }`}>
                {issue.title}
              </h3>

              {/* 프리뷰 */}
              <p className={`text-gray-600 line-clamp-2 ${
                idx === 1 ? 'text-base' : 'text-sm'
              }`}>
                {issue.preview}
              </p>
            </div>
          ))}
        </div>

        {/* PC 화살표 (캐러셀 영역 내부) */}
        {issues.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-300 z-10"
              aria-label="Previous"
            >
              <ChevronLeft className={`w-8 h-8 transition-all duration-300 ${
                isHovered
                  ? 'text-white drop-shadow-lg'
                  : 'text-white/40'
              }`} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-300 z-10"
              aria-label="Next"
            >
              <ChevronRight className={`w-8 h-8 transition-all duration-300 ${
                isHovered
                  ? 'text-white drop-shadow-lg'
                  : 'text-white/40'
              }`} />
            </button>
          </>
        )}
      </div>

      {/* 모바일 버전: 1개씩 보이는 캐러셀 */}
      <div
        className="md:hidden overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="pt-4 pb-2 relative h-[340px]">
          <div
            className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
            style={{
              transform: `translateX(-${currentIndex * 100}%)`
            }}
          >
            {extendedIssues.map((issue, idx) => (
              <div
                key={`${issue.id}-${idx}`}
                className="w-full flex-shrink-0 px-4 cursor-pointer"
                onClick={() => handleIssueClick(issue.display_id)}
              >
                {/* 썸네일 */}
                <div className="relative w-full aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden mb-3">
                  {issue.thumbnail ? (
                    <img
                      src={issue.thumbnail}
                      alt={issue.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <h3 className="text-lg font-bold mb-2 line-clamp-2">
                  {issue.title}
                </h3>

                {/* 프리뷰 */}
                <p className="text-sm text-gray-600 line-clamp-3">
                  {issue.preview}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 모바일 화살표 (터치 시 3초간 보임) */}
        {issues.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className={`absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                isTouched ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label="Previous"
            >
              <ChevronLeft className="w-7 h-7 text-white drop-shadow-lg" />
            </button>
            <button
              onClick={handleNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                isTouched ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label="Next"
            >
              <ChevronRight className="w-7 h-7 text-white drop-shadow-lg" />
            </button>
          </>
        )}

        {/* 모바일 인디케이터 */}
        {issues.length > 1 && (
          <div className="flex justify-center gap-2 pb-2">
            {issues.map((_, index) => {
              const actualIndex = currentIndex === 0 ? issues.length - 1 :
                                 currentIndex === issues.length + 1 ? 0 :
                                 currentIndex - 1
              return (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === actualIndex
                      ? 'bg-slate-800 w-4'
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
