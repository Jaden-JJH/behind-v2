# 후속 기사 타임라인 기능 구현 계획서

**작성일**: 2025-11-03
**프로젝트**: 비하인드 (Behind v2)
**목적**: 이슈에 시간순 후속 기사 타임라인 추가

---

## 📋 목차

1. [요구사항](#요구사항)
2. [현재 상태 분석](#현재-상태-분석)
3. [기술 스택 & 아키텍처 결정](#기술-스택--아키텍처-결정)
4. [데이터베이스 스키마 설계](#데이터베이스-스키마-설계)
5. [API 설계](#api-설계)
6. [UI/UX 디자인 가이드](#uiux-디자인-가이드)
7. [구현 계획](#구현-계획)
8. [주의사항](#주의사항)
9. [규칙](#규칙)
10. [체크리스트](#체크리스트)
11. [완료 목표](#완료-목표)

---

## 📝 요구사항

### 핵심 요구사항

1. **후속 기사 타임라인**
   - 이슈에 연관된 후속 기사를 시간순으로 표시
   - 트랙 레코드 형태의 시각화 (세로 타임라인)
   - 최신 기사부터 과거 순으로 정렬

2. **차등 표시 방식**
   - 최신 뉴스: 전체 미리보기 (썸네일 + 제목 + 설명 + 출처)
   - 나머지 기사: 간략 정보 (제목 + 링크 + 날짜 + 순번)
   - 하이라이트 기능으로 중요 기사 강조

3. **다양한 미디어 타입 지원**
   - 뉴스 기사 (현재 지원 중)
   - 유튜브 (현재 지원 중)
   - 트위터 (신규)
   - 인스타그램 (신규)

4. **어드민 관리 기능**
   - 후속 기사 추가/수정/삭제
   - 순서 변경 (드래그앤드롭 또는 수동)
   - 발행 날짜 입력
   - 하이라이트 설정

5. **기존 기능과의 호환성**
   - 현재 `media_embed.news`, `media_embed.youtube` 유지
   - 후속 기사가 없는 기존 이슈는 정상 작동
   - 마이그레이션 없이 점진적 도입

---

## 🔍 현재 상태 분석

### 기존 미디어 임베드 구조

**데이터베이스 (issues 테이블)**:
```json
{
  "media_embed": {
    "youtube": "https://www.youtube.com/watch?v=abcd1234",
    "news": {
      "title": "Breaking News Title",
      "source": "News Source",
      "url": "https://news.example.com/article"
    }
  }
}
```

**현재 렌더링 위치**: `/app/issues/[id]/page.tsx` (Lines 462-519)
- YouTube: iframe 임베드
- News: 카드 형태 (제목 + 출처 + 링크)

### 제약사항

1. **단일 뉴스만 지원**: `media_embed.news`는 객체 하나만 저장
2. **시간순 정렬 불가**: 배열이 아니므로 순서 개념 없음
3. **소셜 미디어 미지원**: Twitter/Instagram 임베드 없음
4. **확장성 제한**: JSONB 구조로 복잡한 쿼리 어려움

---

## 🏗️ 기술 스택 & 아키텍처 결정

### 선택: 새 테이블 생성 (`issue_articles`)

**이유**:
- ✅ 시간순 정렬 용이 (`published_at` 컬럼)
- ✅ 인덱싱으로 성능 최적화
- ✅ 복잡한 쿼리 지원 (필터링, 페이지네이션)
- ✅ 확장성 (추후 기능 추가 용이)
- ✅ 데이터 정합성 (FK 제약조건)

**대안 (JSONB 확장)**:
- ❌ 복잡한 쿼리 어려움
- ❌ 인덱싱 제한
- ❌ 데이터 무결성 검증 어려움

### 기술 스택

- **데이터베이스**: Supabase PostgreSQL
- **ORM**: Supabase Client (직접 SQL)
- **타입 정의**: TypeScript
- **프론트엔드**: Next.js 15 (App Router)
- **UI 컴포넌트**: Radix UI + Tailwind CSS
- **oEmbed**: 서드파티 API (Twitter, Instagram)

---

## 💾 데이터베이스 스키마 설계

### `issue_articles` 테이블

```sql
CREATE TABLE issue_articles (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,

  -- Article Type
  article_type VARCHAR(20) NOT NULL CHECK (article_type IN ('news', 'youtube', 'twitter', 'instagram')),

  -- Content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source VARCHAR(100), -- 언론사, 채널명, 사용자명

  -- Media
  thumbnail_url TEXT,
  embed_html TEXT, -- oEmbed HTML (Twitter, Instagram)

  -- Metadata
  published_at TIMESTAMP, -- 기사/영상 발행 시간
  display_order INTEGER DEFAULT 0, -- 수동 정렬 순서
  is_highlighted BOOLEAN DEFAULT false, -- 하이라이트 여부

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_issue_articles_issue_id ON issue_articles(issue_id);
CREATE INDEX idx_issue_articles_published_at ON issue_articles(issue_id, published_at DESC);
CREATE INDEX idx_issue_articles_display_order ON issue_articles(issue_id, display_order ASC);

-- Comments
COMMENT ON TABLE issue_articles IS '이슈의 후속 기사 타임라인';
COMMENT ON COLUMN issue_articles.article_type IS '뉴스, 유튜브, 트위터, 인스타그램';
COMMENT ON COLUMN issue_articles.is_highlighted IS '최신/중요 기사 강조 표시';
COMMENT ON COLUMN issue_articles.display_order IS '0부터 시작, 낮을수록 위에 표시';
```

### TypeScript 타입 정의

**파일**: `/types/issue-articles.ts`

```typescript
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

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  id: string
}

export interface ArticleTimelineProps {
  issueId: string
  articles: IssueArticle[]
}
```

---

## 🔌 API 설계

### Public API (사용자용)

#### **GET** `/api/issues/[id]/articles`

**설명**: 특정 이슈의 후속 기사 목록 조회

**Query Parameters**:
- `limit` (optional): 가져올 개수 (기본값: 50)
- `offset` (optional): 페이지네이션 offset (기본값: 0)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "issue_id": "uuid",
      "article_type": "news",
      "title": "후속 기사 제목",
      "description": "기사 요약",
      "url": "https://news.example.com/article",
      "source": "뉴스 출처",
      "thumbnail_url": "https://...",
      "published_at": "2025-11-03T10:00:00Z",
      "display_order": 0,
      "is_highlighted": true,
      "created_at": "2025-11-03T09:00:00Z"
    }
  ],
  "total": 10
}
```

**정렬 순서**:
1. `display_order` ASC (낮은 순서 우선)
2. `published_at` DESC (최신 우선)

**구현 파일**: `/app/api/issues/[id]/articles/route.ts`

---

### Admin API (관리자용)

#### **POST** `/api/admin/issues/[id]/articles`

**설명**: 후속 기사 생성

**Request Body**:
```json
{
  "article_type": "news",
  "title": "새 후속 기사",
  "description": "기사 설명",
  "url": "https://...",
  "source": "언론사",
  "published_at": "2025-11-03T10:00:00Z",
  "is_highlighted": false
}
```

**Validation**:
- `title`: 1-200자
- `url`: 유효한 URL
- `article_type`: enum 값
- `published_at`: ISO 8601 timestamp (optional)

**Response**: 생성된 article 객체

---

#### **PUT** `/api/admin/issues/[id]/articles/[articleId]`

**설명**: 후속 기사 수정

**Request Body**: `CreateArticleInput`의 부분 업데이트

---

#### **DELETE** `/api/admin/issues/[id]/articles/[articleId]`

**설명**: 후속 기사 삭제

**Response**:
```json
{
  "success": true,
  "message": "후속 기사가 삭제되었습니다."
}
```

---

#### **PUT** `/api/admin/issues/[id]/articles/reorder`

**설명**: 후속 기사 순서 일괄 변경

**Request Body**:
```json
{
  "articleIds": ["uuid1", "uuid2", "uuid3"]
}
```

**로직**:
- 배열 순서대로 `display_order`를 0, 1, 2... 로 업데이트
- 트랜잭션으로 일괄 처리

---

#### **POST** `/api/admin/oembed` (Optional)

**설명**: URL에서 oEmbed 데이터 자동 추출

**Request Body**:
```json
{
  "url": "https://twitter.com/user/status/123456"
}
```

**Response**:
```json
{
  "title": "Tweet content",
  "author_name": "@username",
  "thumbnail_url": "https://...",
  "embed_html": "<blockquote>...</blockquote>"
}
```

**지원 플랫폼**:
- Twitter: `https://publish.twitter.com/oembed`
- Instagram: `https://graph.facebook.com/v18.0/instagram_oembed`

---

## 🎨 UI/UX 디자인 가이드

### 타임라인 레이아웃

```
┌─────────────────────────────────────────┐
│  📰 후속 기사 타임라인                  │
├─────────────────────────────────────────┤
│                                          │
│  ●━━━━━ 2025.11.03  #1                  │ ← 하이라이트 (최신)
│  ┃                                       │
│  ┃  ┌────────────────────────────────┐  │
│  ┃  │ [썸네일 이미지]                 │  │
│  ┃  │                                 │  │
│  ┃  │ 📌 후속 기사 제목               │  │
│  ┃  │ 기사 요약 내용이 여기 표시...   │  │
│  ┃  │                                 │  │
│  ┃  │ 출처: 뉴스 언론사               │  │
│  ┃  │ 🔗 기사 전문 보기 →            │  │
│  ┃  └────────────────────────────────┘  │
│  ┃                                       │
│  ○━━━━━ 2025.11.02  #2                  │ ← 일반
│  ┃  제목 | 출처 | 🔗 링크               │
│  ┃                                       │
│  ○━━━━━ 2025.11.01  #3                  │
│  ┃  제목 | 출처 | 🔗 링크               │
│  ┃                                       │
│  ○━━━━━ 2025.10.31  #4                  │
│     제목 | 출처 | 🔗 링크               │
│                                          │
└─────────────────────────────────────────┘
```

### 컴포넌트 구조

**파일**: `/components/article-timeline.tsx`

```tsx
import { IssueArticle } from '@/types/issue-articles'

interface ArticleTimelineProps {
  articles: IssueArticle[]
}

export function ArticleTimeline({ articles }: ArticleTimelineProps) {
  if (articles.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        📰 후속 기사 타임라인
      </h2>

      <div className="relative">
        {articles.map((article, index) => (
          <ArticleTimelineItem
            key={article.id}
            article={article}
            index={index}
            isLast={index === articles.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
```

---

**파일**: `/components/article-timeline-item.tsx`

```tsx
interface ArticleTimelineItemProps {
  article: IssueArticle
  index: number
  isLast: boolean
}

export function ArticleTimelineItem({ article, index, isLast }: ArticleTimelineItemProps) {
  const isHighlighted = article.is_highlighted

  return (
    <div className="relative pl-6 pb-8">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-muted" />
      )}

      {/* Timeline Dot */}
      <div className={cn(
        "absolute left-0 top-1 w-4 h-4 rounded-full border-2",
        isHighlighted
          ? "bg-primary border-primary"
          : "bg-background border-muted-foreground"
      )} />

      {/* Content */}
      <div className="space-y-2">
        {/* Date & Number */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <time>{formatDate(article.published_at)}</time>
          <span className="text-xs">#{index + 1}</span>
        </div>

        {/* Highlighted Card */}
        {isHighlighted ? (
          <Card className="border-2 border-primary">
            <CardContent className="p-4">
              {article.thumbnail_url && (
                <img
                  src={article.thumbnail_url}
                  alt={article.title}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
              )}

              <h3 className="font-semibold text-lg mb-2">
                📌 {article.title}
              </h3>

              {article.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {article.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  출처: {article.source}
                </span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  전문 보기 →
                </a>
              </div>

              {/* Embed Rendering */}
              {renderEmbed(article)}
            </CardContent>
          </Card>
        ) : (
          /* Simple List Item */
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">{article.title}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">{article.source}</span>
            <span className="text-muted-foreground">|</span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              🔗 링크
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 임베드 렌더링 함수

```tsx
function renderEmbed(article: IssueArticle) {
  switch (article.article_type) {
    case 'youtube':
      return (
        <iframe
          src={`https://www.youtube.com/embed/${extractYouTubeId(article.url)}`}
          className="w-full aspect-video rounded-md mt-3"
          allowFullScreen
        />
      )

    case 'twitter':
    case 'instagram':
      return article.embed_html ? (
        <div
          className="mt-3"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(article.embed_html) }}
        />
      ) : null

    default:
      return null
  }
}
```

---

## 🛠️ 구현 계획

### Phase 1: 데이터베이스 & 타입 정의 (Day 1)

#### 1.1 Supabase 마이그레이션 생성

**파일**: `/supabase/migrations/YYYYMMDDHHMMSS_create_issue_articles.sql`

```sql
-- Create issue_articles table
CREATE TABLE issue_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  article_type VARCHAR(20) NOT NULL CHECK (article_type IN ('news', 'youtube', 'twitter', 'instagram')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source VARCHAR(100),
  thumbnail_url TEXT,
  embed_html TEXT,
  published_at TIMESTAMP,
  display_order INTEGER DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_issue_articles_issue_id ON issue_articles(issue_id);
CREATE INDEX idx_issue_articles_published_at ON issue_articles(issue_id, published_at DESC);
CREATE INDEX idx_issue_articles_display_order ON issue_articles(issue_id, display_order ASC);

-- Comments
COMMENT ON TABLE issue_articles IS '이슈의 후속 기사 타임라인';
COMMENT ON COLUMN issue_articles.article_type IS '뉴스, 유튜브, 트위터, 인스타그램';
COMMENT ON COLUMN issue_articles.is_highlighted IS '최신/중요 기사 강조 표시';
COMMENT ON COLUMN issue_articles.display_order IS '0부터 시작, 낮을수록 위에 표시';

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_issue_articles_updated_at
BEFORE UPDATE ON issue_articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**실행 방법**:
```bash
# Supabase CLI 사용
supabase db push

# 또는 Supabase Dashboard에서 직접 실행
```

#### 1.2 TypeScript 타입 정의

**파일**: `/types/issue-articles.ts`

```typescript
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
```

---

### Phase 2: Backend API 구현 (Day 2-3)

#### 2.1 Public API - 조회

**파일**: `/app/api/issues/[id]/articles/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { IssueArticle } from '@/types/issue-articles'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createClient()

    // Fetch articles
    const { data: articles, error, count } = await supabase
      .from('issue_articles')
      .select('*', { count: 'exact' })
      .eq('issue_id', params.id)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data: articles as IssueArticle[],
      total: count || 0
    })
  } catch (error: any) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json(
      { error: '후속 기사를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

#### 2.2 Admin API - CRUD

**파일**: `/app/api/admin/issues/[id]/articles/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { CreateArticleInput } from '@/types/issue-articles'
import { sanitize } from '@/lib/sanitize'

// Admin Auth Check
async function checkAdminAuth() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')

  if (!adminSession) {
    throw new Error('Unauthorized')
  }

  return true
}

// POST - Create Article
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth()

    const body: CreateArticleInput = await request.json()

    // Validation
    if (!body.title || body.title.length < 1 || body.title.length > 200) {
      return NextResponse.json(
        { error: '제목은 1-200자 이내여야 합니다.' },
        { status: 400 }
      )
    }

    if (!body.url || !isValidURL(body.url)) {
      return NextResponse.json(
        { error: '유효한 URL을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      issue_id: params.id,
      article_type: body.article_type,
      title: sanitize(body.title),
      description: body.description ? sanitize(body.description) : null,
      url: body.url,
      source: body.source ? sanitize(body.source) : null,
      thumbnail_url: body.thumbnail_url || null,
      embed_html: body.embed_html ? sanitize(body.embed_html) : null,
      published_at: body.published_at || new Date().toISOString(),
      display_order: body.display_order ?? 0,
      is_highlighted: body.is_highlighted ?? false
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('issue_articles')
      .insert(sanitizedData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to create article:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '후속 기사 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
```

**파일**: `/app/api/admin/issues/[id]/articles/[articleId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { UpdateArticleInput } from '@/types/issue-articles'
import { sanitize } from '@/lib/sanitize'

async function checkAdminAuth() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')
  if (!adminSession) throw new Error('Unauthorized')
  return true
}

// PUT - Update Article
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; articleId: string } }
) {
  try {
    await checkAdminAuth()

    const body: UpdateArticleInput = await request.json()
    const supabase = createClient()

    // Build update object
    const updateData: any = {}

    if (body.title) updateData.title = sanitize(body.title)
    if (body.description !== undefined) {
      updateData.description = body.description ? sanitize(body.description) : null
    }
    if (body.url) updateData.url = body.url
    if (body.source !== undefined) {
      updateData.source = body.source ? sanitize(body.source) : null
    }
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url
    if (body.embed_html !== undefined) {
      updateData.embed_html = body.embed_html ? sanitize(body.embed_html) : null
    }
    if (body.published_at !== undefined) updateData.published_at = body.published_at
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.is_highlighted !== undefined) updateData.is_highlighted = body.is_highlighted
    if (body.article_type) updateData.article_type = body.article_type

    const { data, error } = await supabase
      .from('issue_articles')
      .update(updateData)
      .eq('id', params.articleId)
      .eq('issue_id', params.id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: '후속 기사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to update article:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    return NextResponse.json(
      { error: '후속 기사 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE - Delete Article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; articleId: string } }
) {
  try {
    await checkAdminAuth()

    const supabase = createClient()

    const { error } = await supabase
      .from('issue_articles')
      .delete()
      .eq('id', params.articleId)
      .eq('issue_id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: '후속 기사가 삭제되었습니다.'
    })
  } catch (error: any) {
    console.error('Failed to delete article:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    return NextResponse.json(
      { error: '후속 기사 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

#### 2.3 순서 변경 API

**파일**: `/app/api/admin/issues/[id]/articles/reorder/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function checkAdminAuth() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')
  if (!adminSession) throw new Error('Unauthorized')
  return true
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth()

    const { articleIds }: { articleIds: string[] } = await request.json()

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Update display_order for each article
    const updates = articleIds.map((id, index) =>
      supabase
        .from('issue_articles')
        .update({ display_order: index })
        .eq('id', id)
        .eq('issue_id', params.id)
    )

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: '순서가 변경되었습니다.'
    })
  } catch (error: any) {
    console.error('Failed to reorder articles:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    return NextResponse.json(
      { error: '순서 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

---

### Phase 3: Frontend UI 컴포넌트 (Day 4-5)

#### 3.1 ArticleTimeline 컴포넌트

**파일**: `/components/article-timeline.tsx`

```typescript
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
        <CardTitle className="flex items-center gap-2">
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
```

#### 3.2 ArticleTimelineItem 컴포넌트

**파일**: `/components/article-timeline-item.tsx`

```typescript
'use client'

import { IssueArticle } from '@/types/issue-articles'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
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
                  <img
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
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
  // Use DOMPurify or similar library
  // For now, basic sanitization
  return html
}
```

#### 3.3 이슈 상세 페이지에 통합

**파일**: `/app/issues/[id]/page.tsx`

기존 파일에 추가:

```typescript
// Import 추가
import { ArticleTimeline } from '@/components/article-timeline'
import type { IssueArticle } from '@/types/issue-articles'

// 데이터 fetch 함수 추가
async function fetchArticles(issueId: string): Promise<IssueArticle[]> {
  try {
    const res = await fetch(`/api/issues/${issueId}/articles`, {
      cache: 'no-store'
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return []
  }
}

// Page 컴포넌트 수정
export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await fetchIssue(params.id)
  const articles = await fetchArticles(issue.id) // 추가

  // ... 기존 코드 ...

  return (
    <div>
      {/* ... 기존 콘텐츠 ... */}

      {/* 비하인드 스토리 섹션 아래에 추가 */}
      {articles.length > 0 && (
        <div className="mt-8">
          <ArticleTimeline articles={articles} />
        </div>
      )}

      {/* ... 나머지 콘텐츠 ... */}
    </div>
  )
}
```

---

### Phase 4: Admin 관리 UI (Day 6-7)

#### 4.1 후속 기사 입력 폼 컴포넌트

**파일**: `/components/admin/article-form-fields.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import type { ArticleType } from '@/types/issue-articles'

interface ArticleFormData {
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
    onChange([
      ...articles,
      {
        article_type: 'news',
        title: '',
        description: '',
        url: '',
        source: '',
        thumbnail_url: '',
        published_at: new Date().toISOString().slice(0, 16),
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
        <h3 className="text-lg font-semibold">후속 기사 타임라인</h3>
        <Button type="button" variant="outline" size="sm" onClick={addArticle}>
          <Plus className="w-4 h-4 mr-2" />
          기사 추가
        </Button>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 후속 기사가 없습니다. 버튼을 눌러 추가해보세요.
        </p>
      ) : (
        <div className="space-y-4">
          {articles.map((article, index) => (
            <Card key={index}>
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
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Article Type */}
                <div>
                  <Label>타입</Label>
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
                  <Label>제목 *</Label>
                  <Input
                    value={article.title}
                    onChange={(e) =>
                      updateArticle(index, 'title', e.target.value)
                    }
                    placeholder="후속 기사 제목"
                    maxLength={200}
                  />
                </div>

                {/* URL */}
                <div>
                  <Label>URL *</Label>
                  <Input
                    type="url"
                    value={article.url}
                    onChange={(e) =>
                      updateArticle(index, 'url', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>

                {/* Source */}
                <div>
                  <Label>출처 (언론사/채널명)</Label>
                  <Input
                    value={article.source}
                    onChange={(e) =>
                      updateArticle(index, 'source', e.target.value)
                    }
                    placeholder="예: 한국일보, KBS 뉴스"
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label>설명 (선택)</Label>
                  <Textarea
                    value={article.description}
                    onChange={(e) =>
                      updateArticle(index, 'description', e.target.value)
                    }
                    placeholder="기사 요약 내용"
                    rows={3}
                  />
                </div>

                {/* Thumbnail URL */}
                <div>
                  <Label>썸네일 URL (선택)</Label>
                  <Input
                    type="url"
                    value={article.thumbnail_url}
                    onChange={(e) =>
                      updateArticle(index, 'thumbnail_url', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>

                {/* Published At */}
                <div>
                  <Label>발행일시</Label>
                  <Input
                    type="datetime-local"
                    value={article.published_at}
                    onChange={(e) =>
                      updateArticle(index, 'published_at', e.target.value)
                    }
                  />
                </div>

                {/* Highlight Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`highlight-${index}`}
                    checked={article.is_highlighted}
                    onCheckedChange={(checked) =>
                      updateArticle(index, 'is_highlighted', checked)
                    }
                  />
                  <Label htmlFor={`highlight-${index}`} className="cursor-pointer">
                    하이라이트 (최신 강조)
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### 4.2 이슈 생성 페이지에 통합

**파일**: `/app/admin/issues/new/page.tsx`

기존 폼에 추가:

```typescript
// Import 추가
import { ArticleFormFields } from '@/components/admin/article-form-fields'

export default function NewIssuePage() {
  // ... 기존 state ...
  const [articles, setArticles] = useState<ArticleFormData[]>([])

  // Submit 핸들러 수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 1. Create issue
      const issueRes = await fetch('/api/admin/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* issue data */ })
      })

      if (!issueRes.ok) throw new Error('Failed to create issue')
      const issue = await issueRes.json()

      // 2. Create articles
      if (articles.length > 0) {
        await Promise.all(
          articles.map((article, index) =>
            fetch(`/api/admin/issues/${issue.id}/articles`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...article,
                display_order: index
              })
            })
          )
        )
      }

      toast.success('이슈가 생성되었습니다!')
      router.push('/admin/issues')
    } catch (error) {
      toast.error('이슈 생성에 실패했습니다.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... 기존 필드들 ... */}

      {/* 후속 기사 섹션 추가 */}
      <div className="border-t pt-6 mt-6">
        <ArticleFormFields articles={articles} onChange={setArticles} />
      </div>

      {/* ... Submit 버튼 ... */}
    </form>
  )
}
```

#### 4.3 이슈 수정 모달에 통합

**파일**: `/app/admin/issues/page.tsx`

Edit Modal에 동일하게 `ArticleFormFields` 추가:

```typescript
// Edit 시 기존 articles fetch
useEffect(() => {
  if (editingIssue) {
    fetch(`/api/issues/${editingIssue.id}/articles`)
      .then(res => res.json())
      .then(data => setArticles(data.data || []))
  }
}, [editingIssue])

// Update 핸들러 수정
const handleUpdate = async () => {
  // 1. Update issue
  await fetch(`/api/admin/issues/${editingIssue.id}`, {
    method: 'PUT',
    body: JSON.stringify({ /* issue data */ })
  })

  // 2. Delete removed articles
  const existingIds = articles.map(a => a.id).filter(Boolean)
  // ... delete logic ...

  // 3. Create/Update articles
  for (const [index, article] of articles.entries()) {
    if (article.id) {
      // Update
      await fetch(`/api/admin/issues/${editingIssue.id}/articles/${article.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...article, display_order: index })
      })
    } else {
      // Create
      await fetch(`/api/admin/issues/${editingIssue.id}/articles`, {
        method: 'POST',
        body: JSON.stringify({ ...article, display_order: index })
      })
    }
  }
}
```

---

### Phase 5: 소셜 임베드 & 최적화 (Day 8)

#### 5.1 oEmbed API 통합 (Optional)

**파일**: `/app/api/admin/oembed/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      )
    }

    let oembedData = null

    // Twitter
    if (url.includes('twitter.com') || url.includes('x.com')) {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
      const res = await fetch(oembedUrl)
      oembedData = await res.json()
    }

    // Instagram
    else if (url.includes('instagram.com')) {
      const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
      const res = await fetch(oembedUrl)
      oembedData = await res.json()
    }

    // YouTube (extract ID)
    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYouTubeId(url)
      oembedData = {
        title: 'YouTube Video',
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        author_name: 'YouTube'
      }
    }

    if (!oembedData) {
      return NextResponse.json(
        { error: '지원하지 않는 URL입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      title: oembedData.title || oembedData.author_name || '',
      author_name: oembedData.author_name || '',
      thumbnail_url: oembedData.thumbnail_url || '',
      embed_html: oembedData.html || ''
    })
  } catch (error) {
    console.error('oEmbed fetch failed:', error)
    return NextResponse.json(
      { error: 'oEmbed 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

function extractYouTubeId(url: string): string {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : ''
}
```

#### 5.2 HTML Sanitization

**파일**: `/lib/sanitize-embed.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeEmbedHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'blockquote', 'iframe', 'a', 'p', 'br', 'div', 'span',
      'script', 'cite', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'class', 'data-*', 'width', 'height',
      'frameborder', 'allowfullscreen', 'allow', 'style',
      'cite', 'async', 'charset'
    ],
    ALLOW_DATA_ATTR: true
  })
}
```

#### 5.3 성능 최적화

**이미지 지연 로딩**:

```typescript
// ArticleTimelineItem.tsx
{article.thumbnail_url && (
  <img
    src={article.thumbnail_url}
    alt={article.title}
    loading="lazy" // 추가
    className="w-full h-full object-cover"
  />
)}
```

**임베드 지연 로딩**:

```typescript
'use client'

import { useState, useEffect } from 'react'

function LazyEmbed({ article }: { article: IssueArticle }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { rootMargin: '100px' }
    )

    const element = document.getElementById(`embed-${article.id}`)
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [article.id])

  return (
    <div id={`embed-${article.id}`}>
      {isVisible ? renderEmbed(article) : <div className="h-64 bg-muted animate-pulse" />}
    </div>
  )
}
```

---

## ⚠️ 주의사항

### 1. 기존 기능 호환성

- ✅ **기존 `media_embed.news` 유지**: 새 테이블과 병행 사용
- ✅ **후속 기사 없는 이슈 정상 작동**: `articles.length === 0` 시 컴포넌트 미표시
- ✅ **점진적 도입**: 마이그레이션 없이 신규 이슈부터 적용 가능

### 2. 성능 고려사항

- ⚡ **타임라인 길이 제한**: 기본 50개, 페이지네이션 고려
- ⚡ **임베드 지연 로딩**: Intersection Observer 사용
- ⚡ **이미지 최적화**: Next.js Image 컴포넌트 또는 `loading="lazy"`
- ⚡ **API 캐싱**: `cache: 'no-store'` 대신 ISR 고려

### 3. 보안

- 🔒 **XSS 방지**: DOMPurify로 모든 HTML sanitize
- 🔒 **URL 검증**: `new URL()` 예외 처리
- 🔒 **Admin 권한 체크**: 모든 변경 작업에 인증 필수
- 🔒 **CSRF 보호**: Next.js 기본 제공

### 4. 데이터 정합성

- 💾 **CASCADE DELETE**: 이슈 삭제 시 연관 articles 자동 삭제
- 💾 **트랜잭션 처리**: 이슈+기사 동시 생성 시 실패 롤백
- 💾 **Timestamp 자동 갱신**: `updated_at` trigger

### 5. UX 고려사항

- 📱 **반응형 디자인**: 모바일에서도 타임라인 명확하게 표시
- 📱 **로딩 상태**: Skeleton UI로 로딩 중 표시
- 📱 **에러 처리**: 친화적인 에러 메시지
- 📱 **접근성**: ARIA 레이블, 키보드 네비게이션

---

## 📏 규칙

### 1. 코드 스타일

- ✅ 기존 프로젝트 컨벤션 준수 (케밥케이스, 파스칼케이스)
- ✅ TypeScript strict mode
- ✅ ESLint 규칙 통과
- ✅ Prettier 포맷팅

### 2. 컴포넌트 구조

- ✅ Server/Client 컴포넌트 명확히 구분 (`'use client'` 최소화)
- ✅ Props 타입 명시 (interface 사용)
- ✅ 재사용 가능한 작은 컴포넌트
- ✅ UI 컴포넌트는 `/components/ui/` 사용

### 3. API 설계

- ✅ RESTful 원칙
- ✅ 일관된 에러 응답 형식
- ✅ 적절한 HTTP 상태 코드 (200, 400, 401, 404, 500)
- ✅ Request/Response 타입 명시

### 4. 데이터베이스

- ✅ 마이그레이션 파일로 스키마 관리
- ✅ 인덱스 최적화 (자주 쿼리하는 컬럼)
- ✅ 제약조건 명시 (FK, CHECK)
- ✅ 주석으로 컬럼 설명

### 5. 접근성

- ✅ ARIA 레이블 (`aria-label`, `role`)
- ✅ 키보드 네비게이션 지원
- ✅ 스크린 리더 호환
- ✅ 충분한 색상 대비

---

## ✅ 체크리스트

### Phase 1: 데이터베이스 & 타입 (2/2)

- [x] Supabase 마이그레이션 파일 작성
- [x] 마이그레이션 실행 및 테이블 생성 확인
- [x] TypeScript 타입 정의 (`/types/issue-articles.ts`)
- [x] 타입 임포트 테스트

### Phase 2: Backend API (6/6)

- [ ] Public API: GET `/api/issues/[id]/articles` 구현
- [ ] Public API 테스트 (Postman/Thunder Client)
- [ ] Admin API: POST `/api/admin/issues/[id]/articles` 구현
- [ ] Admin API: PUT `/api/admin/issues/[id]/articles/[articleId]` 구현
- [ ] Admin API: DELETE `/api/admin/issues/[id]/articles/[articleId]` 구현
- [ ] Admin API: PUT `/api/admin/issues/[id]/articles/reorder` 구현
- [ ] 모든 API 엔드포인트 테스트
- [ ] 에러 핸들링 확인
- [ ] 인증/권한 체크 동작 확인

### Phase 3: Frontend UI (8/8)

- [ ] `/components/article-timeline.tsx` 작성
- [ ] `/components/article-timeline-item.tsx` 작성
- [ ] 타임라인 레이아웃 스타일링 (CSS/Tailwind)
- [ ] 하이라이트/일반 아이템 스타일 차별화
- [ ] 각 타입별 임베드 렌더링 (news, youtube, twitter, instagram)
- [ ] `/app/issues/[id]/page.tsx`에 타임라인 통합
- [ ] 데이터 fetch 로직 추가
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] 반응형 디자인 확인 (모바일/태블릿/데스크탑)

### Phase 4: Admin 관리 UI (7/7)

- [ ] `/components/admin/article-form-fields.tsx` 작성
- [ ] 동적 폼 (추가/삭제) 동작 확인
- [ ] 모든 입력 필드 validation
- [ ] `/app/admin/issues/new/page.tsx`에 후속 기사 섹션 추가
- [ ] 이슈 생성 시 articles 동시 생성 로직
- [ ] `/app/admin/issues/page.tsx` Edit 모달에 통합
- [ ] 기존 articles fetch 및 수정 로직
- [ ] 순서 변경 기능 (드래그앤드롭 또는 수동)
- [ ] 생성/수정/삭제 동작 테스트

### Phase 5: 소셜 임베드 & 최적화 (6/6)

- [ ] `/app/api/admin/oembed/route.ts` 구현 (Optional)
- [ ] Twitter oEmbed 테스트
- [ ] Instagram oEmbed 테스트 (Access Token 필요)
- [ ] YouTube 임베드 테스트
- [ ] `/lib/sanitize-embed.ts` 구현
- [ ] XSS 공격 시나리오 테스트
- [ ] 이미지 지연 로딩 적용
- [ ] 임베드 지연 로딩 (Intersection Observer)
- [ ] 페이지 로드 성능 측정 (Lighthouse)
- [ ] 접근성 테스트 (axe DevTools)

### 테스트 & QA (10/10)

- [ ] 기능 테스트: 후속 기사 생성
- [ ] 기능 테스트: 후속 기사 수정
- [ ] 기능 테스트: 후속 기사 삭제
- [ ] 기능 테스트: 순서 변경
- [ ] 기능 테스트: 타임라인 렌더링
- [ ] 회귀 테스트: 기존 이슈 정상 작동 확인
- [ ] 보안 테스트: XSS, CSRF
- [ ] 성능 테스트: 페이지 로드 시간 (< 3초)
- [ ] 접근성 테스트: 키보드 네비게이션
- [ ] 브라우저 호환성: Chrome, Safari, Firefox, Edge

### 문서화 & 배포 (4/4)

- [ ] README 업데이트 (새 기능 설명)
- [ ] API 문서 작성 (엔드포인트 스펙)
- [ ] 관리자 가이드 작성 (후속 기사 등록 방법)
- [ ] Git 커밋 & PR 생성
- [ ] 코드 리뷰 요청
- [ ] Production 배포

---

## 🎯 완료 목표

### 기능적 목표

1. ✅ 관리자가 어드민 패널에서 후속 기사를 자유롭게 추가/수정/삭제할 수 있다
2. ✅ 이슈 상세 페이지에 타임라인이 시각적으로 명확하게 표시된다
3. ✅ 최신 기사는 하이라이트되어 전체 정보가 표시되고, 나머지는 간략하게 표시된다
4. ✅ 뉴스, 유튜브, 트위터, 인스타그램 4가지 타입을 모두 지원한다
5. ✅ 발행일시를 기준으로 시간순 정렬되며 순번이 표시된다

### 기술적 목표

1. ✅ 데이터베이스 마이그레이션이 성공적으로 적용되고 롤백 가능하다
2. ✅ 모든 API 엔드포인트가 정상 작동하며 적절한 에러 핸들링이 되어있다
3. ✅ TypeScript 타입 에러가 없으며 strict mode를 통과한다
4. ✅ 기존 기능(이슈 목록, 상세, 투표, 채팅 등)에 영향을 주지 않는다
5. ✅ ESLint/Prettier 규칙을 모두 통과한다

### UX 목표

1. ✅ 모바일/태블릿/데스크탑 모든 환경에서 타임라인이 잘 보인다
2. ✅ 로딩 상태가 Skeleton UI로 명확하게 표시된다
3. ✅ 에러 발생 시 사용자 친화적인 메시지가 표시된다
4. ✅ 접근성 기준(WCAG 2.1 AA)을 충족한다
5. ✅ 임베드 콘텐츠가 지연 로딩되어 초기 로딩이 빠르다

### 품질 목표

1. ✅ XSS/CSRF 등 보안 취약점이 없다
2. ✅ 페이지 로드 시간이 3초 이내다 (Lighthouse Performance > 80)
3. ✅ 코드 리뷰를 통과하고 Best Practice를 따른다
4. ✅ Chrome, Safari, Firefox, Edge 주요 브라우저에서 테스트 완료
5. ✅ 회귀 테스트를 통과하여 기존 기능이 정상 작동한다

### 성공 지표

- **정량적**:
  - 후속 기사 등록률: 신규 이슈의 50% 이상이 후속 기사를 가짐
  - 페이지 이탈률 감소: 이슈 상세 페이지 평균 체류시간 20% 증가
  - 에러율: API 에러율 < 0.1%

- **정성적**:
  - 관리자 피드백: 후속 기사 등록이 직관적이고 쉽다
  - 사용자 피드백: 타임라인이 이슈 흐름 파악에 도움이 된다
  - 코드 품질: 리뷰어의 승인 및 개선 제안 반영

---

## 🔄 진행 상황 추적

### 진척률

- **Phase 1**: ⬜⬜⬜⬜⬜ 0% (0/2 완료)
- **Phase 2**: ⬜⬜⬜⬜⬜ 0% (0/6 완료)
- **Phase 3**: ⬜⬜⬜⬜⬜ 0% (0/8 완료)
- **Phase 4**: ⬜⬜⬜⬜⬜ 0% (0/7 완료)
- **Phase 5**: ⬜⬜⬜⬜⬜ 0% (0/6 완료)
- **테스트**: ⬜⬜⬜⬜⬜ 0% (0/10 완료)
- **배포**: ⬜⬜⬜⬜⬜ 0% (0/4 완료)

**전체 진행률**: 0% (0/43 완료)

### 예상 소요 시간

- **Phase 1**: 1일 (4시간)
- **Phase 2**: 2일 (12시간)
- **Phase 3**: 2일 (12시간)
- **Phase 4**: 2일 (12시간)
- **Phase 5**: 1일 (6시간)
- **테스트 & QA**: 1일 (6시간)
- **배포**: 0.5일 (3시간)

**총 예상 시간**: 9.5일 (약 55시간)

---

## 📌 결정 필요 사항

다음 사항은 구현 전에 확인이 필요합니다:

### 1. 기존 `media_embed.news` 처리

**질문**: 현재 `media_embed.news` 필드는 어떻게 처리할까요?

**옵션**:
- A. 그대로 유지하고 후속 기사와 별도로 표시
- B. 첫 번째 후속 기사로 마이그레이션
- C. 점진적 폐기 (신규 이슈는 후속 기사만 사용)

**권장**: Option A (호환성 우선)

### 2. 후속 기사 타입 범위

**질문**: 후속 기사에 뉴스/유튜브 외에 다른 타입도 포함할까요?

**현재 계획**: 뉴스, 유튜브, 트위터, 인스타그램

**추가 가능**: 블로그, 팟캐스트, TikTok 등

### 3. 순서 정렬 방식

**질문**: 기본 정렬 기준은 무엇으로 할까요?

**옵션**:
- A. `published_at` DESC (최신순) - 자동
- B. `display_order` ASC (수동 순서) - 관리자 지정
- C. A + B 혼용 (display_order 우선, 동일 시 published_at)

**권장**: Option C (유연성)

### 4. oEmbed 자동 추출

**질문**: URL 입력 시 제목/썸네일을 자동으로 가져올까요?

**장점**: UX 개선, 관리자 편의성
**단점**: API Rate Limit, 외부 의존성

**권장**: Optional 기능으로 구현 (Phase 5)

### 5. 하이라이트 개수 제한

**질문**: 하이라이트는 몇 개까지 허용할까요?

**옵션**:
- A. 제한 없음
- B. 1개만 (최신)
- C. 3개까지

**권장**: Option B (명확성)

---

## 📞 문의 및 지원

- **작성자**: Claude (AI Assistant)
- **프로젝트**: Behind v2
- **문서 버전**: 1.0
- **최종 수정**: 2025-11-03

이 문서는 후속 기사 타임라인 기능 구현의 모든 단계를 안내합니다.
각 Phase를 완료할 때마다 체크리스트를 업데이트하고, 진행률을 추적하세요.

구현 중 질문이나 이슈가 발생하면 이 문서를 참고하여 일관성을 유지하세요.

---

**Good luck! 🚀**
