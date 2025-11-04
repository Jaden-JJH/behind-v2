'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import type { ArticleType } from '@/types/issue-articles'

export interface ArticleFormData {
  id?: string
  article_type: ArticleType
  title: string
  description: string
  url: string
  source: string
  thumbnail_url: string
  published_at: string
  is_highlighted: boolean
}

interface ArticleFormFieldsProps {
  articles: ArticleFormData[]
  onChange: (articles: ArticleFormData[]) => void
}

export function ArticleFormFields({ articles, onChange }: ArticleFormFieldsProps) {
  const addArticle = () => {
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)

    onChange([
      ...articles,
      {
        article_type: 'news',
        title: '',
        description: '',
        url: '',
        source: '',
        thumbnail_url: '',
        published_at: localDateTime,
        is_highlighted: false
      }
    ])
  }

  const removeArticle = (index: number) => {
    onChange(articles.filter((_, i) => i !== index))
  }

  const updateArticle = (index: number, field: string, value: any) => {
    const updated = [...articles]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">후속 기사 타임라인</h3>
          <p className="text-sm text-gray-500 mt-1">
            이슈와 관련된 후속 기사를 시간순으로 추가할 수 있습니다
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addArticle}>
          <Plus className="w-4 h-4 mr-2" />
          기사 추가
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">
            아직 후속 기사가 없습니다. 버튼을 눌러 추가해보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    후속 기사 #{index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArticle(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Article Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">타입 *</label>
                  <Select
                    value={article.article_type}
                    onValueChange={(value) =>
                      updateArticle(index, 'article_type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">뉴스 기사</SelectItem>
                      <SelectItem value="youtube">유튜브</SelectItem>
                      <SelectItem value="twitter">트위터</SelectItem>
                      <SelectItem value="instagram">인스타그램</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">제목 *</label>
                  <Input
                    value={article.title}
                    onChange={(e) =>
                      updateArticle(index, 'title', e.target.value)
                    }
                    placeholder="후속 기사 제목 (예: 롤렉스 투자, 과연 안전할까?)"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">{article.title.length}/200자</p>
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">URL *</label>
                  <Input
                    type="url"
                    value={article.url}
                    onChange={(e) =>
                      updateArticle(index, 'url', e.target.value)
                    }
                    placeholder="https://example.com/news/article"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium mb-1">출처 (언론사/채널명)</label>
                  <Input
                    value={article.source}
                    onChange={(e) =>
                      updateArticle(index, 'source', e.target.value)
                    }
                    placeholder="예: 경제일보, KBS 뉴스, 재테크 채널"
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">설명 (선택)</label>
                  <Textarea
                    value={article.description}
                    onChange={(e) =>
                      updateArticle(index, 'description', e.target.value)
                    }
                    placeholder="기사 요약 내용 (하이라이트 표시 시 보여짐)"
                    rows={3}
                  />
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">썸네일 URL (선택)</label>
                  <Input
                    type="url"
                    value={article.thumbnail_url}
                    onChange={(e) =>
                      updateArticle(index, 'thumbnail_url', e.target.value)
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    이미지가 있으면 하이라이트 표시 시 상단에 보여집니다
                  </p>
                </div>

                {/* Published At */}
                <div>
                  <label className="block text-sm font-medium mb-1">발행일시 *</label>
                  <Input
                    type="datetime-local"
                    value={article.published_at}
                    onChange={(e) =>
                      updateArticle(index, 'published_at', e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    타임라인 정렬에 사용됩니다
                  </p>
                </div>

                {/* Highlight Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id={`highlight-${index}`}
                    checked={article.is_highlighted}
                    onChange={(e) =>
                      updateArticle(index, 'is_highlighted', e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor={`highlight-${index}`} className="text-sm font-medium cursor-pointer">
                    하이라이트 (최신/중요 기사 강조 표시)
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  하이라이트된 기사는 썸네일, 제목, 설명이 모두 표시됩니다
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium mb-1">💡 작성 팁</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>제목과 URL은 필수 항목입니다</li>
          <li>발행일시 순서대로 타임라인에 표시됩니다</li>
          <li>중요한 기사는 하이라이트로 설정하면 눈에 잘 띕니다</li>
          <li>유튜브 URL을 입력하면 자동으로 영상이 임베드됩니다</li>
        </ul>
      </div>
    </div>
  )
}
