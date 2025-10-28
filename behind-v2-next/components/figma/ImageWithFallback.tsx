import React, { useMemo, useState } from 'react'

const PLACEHOLDER_IMG_SRC = '/behind-placeholder.svg'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, alt, className, style, fallbackSrc, ...rest } = props
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

  return (
    <img
      src={resolvedSrc}
      alt={alt || 'Behind issue thumbnail'}
      className={className}
      style={style}
      onError={hasValidSrc ? handleError : undefined}
      data-original-src={hasValidSrc ? src : undefined}
      {...rest}
    />
  )
}
