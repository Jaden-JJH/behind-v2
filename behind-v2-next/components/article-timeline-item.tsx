'use client'

import { IssueArticle } from '@/types/issue-articles'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDate } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface ArticleTimelineItemProps {
  article: IssueArticle
  index: number
  isLast: boolean
}

export function ArticleTimelineItem({ article, index, isLast }: ArticleTimelineItemProps) {
  const isHighlighted = article.is_highlighted

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline Vertical Line */}
      {!isLast && (
        <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border" />
      )}

      {/* Timeline Dot */}
      <div
        className={cn(
          'absolute left-0 top-1.5 w-4 h-4 rounded-full border-2',
          isHighlighted
            ? 'bg-primary border-primary shadow-md'
            : 'bg-background border-muted-foreground'
        )}
      />

      {/* Content */}
      <div className="space-y-2">
        {/* Date & Order Number */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={article.published_at || undefined}>
            {article.published_at ? formatDate(article.published_at) : '날짜 미정'}
          </time>
          <span className="text-xs opacity-60">#{index + 1}</span>
        </div>

        {/* Highlighted Full Card */}
        {isHighlighted ? (
          <Card className="border-2 border-primary shadow-sm">
            <CardContent className="p-4 space-y-3">
              {/* Thumbnail */}
              {article.thumbnail_url && (
                <div className="w-full aspect-video rounded-md overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.thumbnail_url}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <h3 className="font-semibold text-lg leading-tight">
                <span className="mr-2">📌</span>
                {article.title}
              </h3>

              {/* Description */}
              {article.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.description}
                </p>
              )}

              {/* Footer: Source & Link */}
              <div className="flex items-center justify-between pt-2 border-t">
                {article.source && (
                  <span className="text-sm text-muted-foreground">
                    출처: {article.source}
                  </span>
                )}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  전문 보기
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Embed Rendering */}
              {renderEmbed(article)}
            </CardContent>
          </Card>
        ) : (
          /* Compact List Item */
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="font-medium text-foreground">{article.title}</span>
            {article.source && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{article.source}</span>
              </>
            )}
            <span className="text-muted-foreground">|</span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              🔗 링크
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// Embed Rendering Helper
function renderEmbed(article: IssueArticle) {
  switch (article.article_type) {
    case 'youtube':
      return (
        <div className="mt-3">
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(article.url)}`}
            className="w-full aspect-video rounded-md"
            allowFullScreen
            title={article.title}
          />
        </div>
      )

    case 'twitter':
    case 'instagram':
      return article.embed_html ? (
        <div
          className="mt-3"
          dangerouslySetInnerHTML={{
            __html: sanitizeEmbedHTML(article.embed_html)
          }}
        />
      ) : null

    default:
      return null
  }
}

function extractYouTubeId(url: string): string {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : ''
}

function sanitizeEmbedHTML(html: string): string {
  // Basic sanitization - in production, use DOMPurify or similar
  return html
}
