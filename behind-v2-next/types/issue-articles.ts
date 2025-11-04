export type ArticleType = 'news' | 'youtube' | 'twitter' | 'instagram'

export interface IssueArticle {
  id: string
  issue_id: string
  article_type: ArticleType
  title: string
  description?: string | null
  url: string
  source?: string | null
  thumbnail_url?: string | null
  embed_html?: string | null
  published_at?: string | null
  display_order: number
  is_highlighted: boolean
  created_at: string
  updated_at: string
}

export interface CreateArticleInput {
  article_type: ArticleType
  title: string
  description?: string
  url: string
  source?: string
  thumbnail_url?: string
  embed_html?: string
  published_at?: string
  display_order?: number
  is_highlighted?: boolean
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {}

export interface ArticleTimelineProps {
  issueId: string
  articles: IssueArticle[]
}

export interface ArticleTimelineItemProps {
  article: IssueArticle
  index: number
  isLast: boolean
}
