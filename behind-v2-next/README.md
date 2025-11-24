# Behind v2 - 이슈 기반 소셜 플랫폼

Behind는 사회적 이슈를 중심으로 사용자들이 토론하고 정보를 공유하는 플랫폼입니다.

---

## 📚 주요 기능

### 1. 이슈 관리
- 이슈 생성, 수정, 삭제
- 이슈 상세 페이지
- 미디어 임베드 (뉴스, YouTube)

### 2. 투표 시스템
- 이슈별 투표 생성 및 실시간 결과 확인
- 투표 결과 시각화

### 3. 채팅 기능
- 이슈별 실시간 채팅방
- Supabase Realtime 사용

### 4. 댓글 시스템
- 이슈별 댓글 작성
- 댓글 좋아요, 대댓글 지원

### 5. 후속 기사 타임라인 ✨ **NEW**
- 이슈의 시간 순서별 관련 기사 표시
- 4가지 기사 타입 지원 (뉴스, YouTube, Twitter, Instagram)
- 하이라이트 기능으로 중요 기사 강조
- Drag & Drop으로 순서 변경

---

## 🚀 시작하기

### 1. 환경 설정

Node.js 18 이상이 필요합니다.

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 빌드

```bash
npm run build
npm start
```

---

## 🗂️ 프로젝트 구조

```
behind-v2-next/
├── app/                      # Next.js App Router
│   ├── admin/               # 관리자 페이지
│   ├── api/                 # API Routes
│   ├── chat/               # 채팅 페이지
│   └── issues/             # 이슈 페이지
├── components/              # React 컴포넌트
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── admin/              # 어드민 컴포넌트
│   ├── article-timeline.tsx           # 후속 기사 타임라인
│   └── article-timeline-item.tsx      # 타임라인 아이템
├── lib/                     # 유틸리티 함수
│   ├── supabase.ts         # Supabase 클라이언트
│   ├── sanitize.ts         # HTML Sanitization
│   └── utils.ts            # 기타 유틸리티
├── types/                   # TypeScript 타입 정의
├── docs/                    # 문서
│   └── ADMIN_GUIDE.md      # 관리자 가이드
└── README.md
```

---

## 🛠️ 기술 스택

### Frontend
- **Next.js 15**: React 프레임워크 (App Router)
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트 라이브러리

### Backend
- **Supabase**: 데이터베이스 (PostgreSQL) + 인증 + Realtime
- **Next.js API Routes**: 서버 API

### 보안
- **DOMPurify**: HTML Sanitization (XSS 방지)

---

## 📖 후속 기사 타임라인

### 지원하는 기사 타입

1. **뉴스 (news)**: 일반 뉴스 기사
2. **YouTube (youtube)**: YouTube 영상 (자동 임베드)
3. **Twitter (twitter)**: Twitter/X 포스트
4. **Instagram (instagram)**: Instagram 포스트

### API 엔드포인트

#### Public API
```
GET  /api/issues/[id]/articles
```

#### Admin API
```
POST   /api/admin/issues/[id]/articles
PUT    /api/admin/issues/[id]/articles/[articleId]
DELETE /api/admin/issues/[id]/articles/[articleId]
PUT    /api/admin/issues/[id]/articles/reorder
```

### 보안 기능

- **XSS 방어**: DOMPurify를 사용한 HTML Sanitization
- **인증 & 권한**: Cookie 기반 관리자 인증
- **입력 검증**: 제목 길이, URL 형식, article_type Enum 검증

### 관리자 가이드

자세한 사용 방법은 [관리자 가이드](docs/ADMIN_GUIDE.md)를 참고하세요.

---

## 📦 데이터베이스

### `issue_articles` 테이블

```sql
CREATE TABLE issue_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  article_type VARCHAR(20) NOT NULL CHECK (article_type IN ('news', 'youtube', 'twitter', 'instagram')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source VARCHAR(100),
  thumbnail_url TEXT,
  embed_html TEXT,
  published_at TIMESTAMPTZ,
  display_order INT DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

**최종 업데이트**: 2025-11-04
**버전**: 2.0.0 (후속 기사 타임라인 추가)
