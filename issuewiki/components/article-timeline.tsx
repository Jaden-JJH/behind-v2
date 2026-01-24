'use client'

import { IssueArticle } from '@/types/issue-articles'
import { ArticleTimelineItem } from './article-timeline-item'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ArticleTimelineProps {
  articles: IssueArticle[]
}

export function ArticleTimeline({ articles }: ArticleTimelineProps) {
  if (articles.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
          <span className="text-2xl">📰</span>
          후속 기사 타임라인
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {articles.map((article, index) => (
            <ArticleTimelineItem
              key={article.id}
              article={article}
              index={index}
              isLast={index === articles.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
