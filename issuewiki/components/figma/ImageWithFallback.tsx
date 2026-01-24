'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'

const PLACEHOLDER_IMG_SRC = '/behind-placeholder.svg'

interface ImageWithFallbackProps {
  src?: string
  alt?: string
  className?: string
  fallbackSrc?: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  sizes?: string
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, alt, className, fallbackSrc, fill, priority, sizes, width, height, ...rest } = props
  const [didError, setDidError] = useState(false)

  const hasValidSrc = useMemo(() => {
    return typeof src === 'string' && src.trim().length > 0
  }, [src])

  const resolvedSrc = useMemo(() => {
    if (didError) return fallbackSrc || PLACEHOLDER_IMG_SRC
    if (hasValidSrc) return src as string
    return fallbackSrc || PLACEHOLDER_IMG_SRC
  }, [didError, fallbackSrc, hasValidSrc, src])

  const handleError = () => {
    if (!didError && hasValidSrc) {
      setDidError(true)
    }
  }

  // fill 모드 사용 시
  if (fill) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt || '이슈위키 썸네일'}
        className={className}
        fill
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        onError={hasValidSrc ? handleError : undefined}
        priority={priority}
        {...rest}
      />
    )
  }

  // 명시적 width/height 사용 시
  if (width && height) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt || '이슈위키 썸네일'}
        className={className}
        width={width}
        height={height}
        onError={hasValidSrc ? handleError : undefined}
        priority={priority}
        {...rest}
      />
    )
  }

  // fallback: 기본 img 태그 (next/image 요구사항을 충족하지 못할 때)
  return (
    <img
      src={resolvedSrc}
      alt={alt || '이슈위키 썸네일'}
      className={className}
      onError={hasValidSrc ? handleError : undefined}
      {...rest}
    />
  )
}
