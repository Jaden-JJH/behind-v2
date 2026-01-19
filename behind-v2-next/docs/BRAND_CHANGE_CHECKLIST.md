# 이슈위키 브랜드/서비스명 변경 체크리스트

> 서비스명, 슬로건, 도메인 변경 시 이 문서를 참고하세요.
> 마지막 업데이트: 2026-01-18

---

## 현재 브랜드 정보

| 항목 | 값 |
|------|-----|
| 서비스명 (한글) | 이슈위키 |
| 서비스명 (영문) | IssueWiki |
| 슬로건 | 대한민국 No.1 뉴스 아카이브 |
| 회사명 | 스톤즈랩 |
| 저작권 | © 2026 스톤즈랩 |

---

## 1. 메타데이터 (SEO/OG Tags)

| 항목 | 파일 경로 | 현재 값 |
|------|----------|---------|
| 메타 타이틀 | `app/layout.tsx:21` | "이슈위키 - 대한민국 No.1 뉴스 아카이브" |
| 메타 설명 | `app/layout.tsx:22` | "지금 가장 뜨거운 이슈의 뒷이야기를 나누는 공간..." |
| OG 타이틀 | `app/layout.tsx:30` | "이슈위키 - 대한민국 No.1 뉴스 아카이브" |
| OG 설명 | `app/layout.tsx:31` | (위와 동일) |
| OG 사이트명 | `app/layout.tsx:34` | "이슈위키" |
| Twitter 타이틀 | `app/layout.tsx:38` | "이슈위키 - 대한민국 No.1 뉴스 아카이브" |
| 키워드 | `app/layout.tsx:41` | "뉴스", "이슈", "아카이브", "이슈위키", "IssueWiki"... |
| 작성자/발행자 | `app/layout.tsx:42-44` | "스톤즈랩" |

### OG 이미지 추가 시
```typescript
// app/layout.tsx의 openGraph 객체에 추가
openGraph: {
  // ... 기존 설정
  images: [
    {
      url: '/og-image.png',  // public 폴더에 1200x630px 이미지 추가
      width: 1200,
      height: 630,
      alt: '이슈위키 - 대한민국 No.1 뉴스 아카이브',
    },
  ],
},
```

---

## 2. 헤더/푸터

| 항목 | 파일 경로 | 현재 값 |
|------|----------|---------|
| 헤더 로고 텍스트 | `components/Header.tsx:97` | "이슈위키" |
| 메인 푸터 | `components/Footer.tsx:9` | "© 2026 스톤즈랩. All rights reserved." |
| 채팅 페이지 푸터 | `app/chat/[id]/page.tsx:452` | "© 2026 스톤즈랩. 대한민국 No.1 뉴스 아카이브." |
| 이슈 페이지 푸터 | `app/issues/[id]/page.tsx:816` | "© 2026 스톤즈랩. 대한민국 No.1 뉴스 아카이브." |

---

## 3. 컴포넌트

| 항목 | 파일 경로 | 현재 값 |
|------|----------|---------|
| 닉네임 모달 | `components/NicknameModal.tsx:175` | "이슈위키에서 사용할 닉네임을 설정해주세요" |
| 제보 배너 | `components/ReportBanner.tsx:33` | "월 7,000명이 함께하는 이슈 토론, 이슈위키" |
| 이미지 alt 텍스트 | `components/figma/ImageWithFallback.tsx` | "이슈위키 썸네일" |

---

## 4. 어드민 페이지

| 항목 | 파일 경로 | 현재 값 |
|------|----------|---------|
| 대시보드 제목 | `app/admin/page.tsx:22` | "이슈위키 어드민 대시보드" |
| 사이드바 제목 (데스크탑) | `app/admin/layout.tsx:81` | "이슈위키 어드민" |
| 헤더 제목 (모바일) | `app/admin/layout.tsx:197` | "이슈위키 어드민" |

---

## 5. 법적 문서/페이지

| 항목 | 파일 경로 | 현재 값 |
|------|----------|---------|
| 이용약관 메타 | `app/terms/page.tsx:7-8` | "이용약관 - 이슈위키" |
| 이용약관 제목 | `app/terms/page.tsx:25` | "이슈위키 서비스 이용약관" |
| 개인정보 메타 | `app/privacy/page.tsx:7-8` | "개인정보처리방침 - 이슈위키" |
| 개인정보 제목 | `app/privacy/page.tsx:25` | "이슈위키 개인정보처리방침" |

### 법적 문서 원본 (마크다운)
| 문서 | 파일 경로 |
|------|----------|
| 이용약관 | `docs/Terms_of_Use.md` |
| 개인정보처리방침 | `docs/Privacy_policy.md` |

---

## 6. 이메일 템플릿

| 항목 | 파일 경로 | 현재 값 |
|------|----------|---------|
| 신고 알림 인사 | `lib/email.ts:151` | "안녕하세요, 이슈위키 관리자님." |
| 신고 알림 발신자 | `lib/email.ts:216` | "IssueWiki Reports <reports@issuewiki.com>" |
| 푸터 텍스트 | `lib/email.ts:206` | "이슈위키 신고 시스템에서 자동으로 발송" |
| 테스트 이메일 | `lib/email.ts:246-249` | "IssueWiki <test@issuewiki.com>" |

---

## 7. 환경변수 (도메인 변경 시)

| 변수명 | 파일 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | `.env.local` | 앱 기본 URL (sitemap, robots에서 사용) |
| `ALLOWED_ORIGINS` | `.env.local` | CORS 허용 오리진 목록 |
| `ADMIN_EMAIL` | `.env.local` | 관리자 이메일 (현재: kr.behind@gmail.com) |

### 프로덕션 배포 시 환경변수 예시
```env
NEXT_PUBLIC_APP_URL=https://issuewiki.com
ALLOWED_ORIGINS=https://issuewiki.com,https://www.issuewiki.com
```

---

## 8. SEO 관련 파일

| 파일 | 경로 | 설명 |
|------|------|------|
| robots.txt | `app/robots.ts` | 검색엔진 크롤링 규칙 |
| sitemap.xml | `app/sitemap.ts` | 검색엔진 인덱싱용 사이트맵 |

---

## 9. 이미지 에셋

| 항목 | 경로 | 권장 사양 |
|------|------|----------|
| OG 이미지 | `public/og-image.png` (생성 필요) | 1200x630px |
| 파비콘 | `app/favicon.ico` | 32x32px, 16x16px |
| 로고 이미지 | `public/logo.png` (필요 시) | SVG 권장 |

---

## 10. 외부 링크

| 항목 | 파일 경로 | 현재 URL |
|------|----------|----------|
| 제보하기 폼 | `components/Header.tsx:116` | Google Forms 링크 |

---

## 변경 작업 순서 권장

1. **환경변수 설정** - `.env.local` 또는 Vercel 환경변수
2. **메타데이터 수정** - `app/layout.tsx`
3. **헤더/푸터 수정** - 위 2, 3번 항목 파일들
4. **컴포넌트 수정** - 위 3번 항목 파일들
5. **어드민 페이지 수정** - 위 4번 항목 파일들
6. **법적 문서 수정** - 위 5번 항목 파일들
7. **이메일 템플릿 수정** - 위 6번 항목 파일
8. **이미지 교체** - public 폴더
9. **빌드 테스트** - `npm run build`
10. **배포** - Vercel/프로덕션

---

## 빠른 검색 명령어

```bash
# "이슈위키" 검색
grep -r "이슈위키" --include="*.tsx" --include="*.ts" app/ components/ lib/

# "IssueWiki" 검색
grep -r "IssueWiki" --include="*.tsx" --include="*.ts" app/ components/ lib/

# "스톤즈랩" 검색
grep -r "스톤즈랩" --include="*.tsx" --include="*.ts" app/ components/

# 특정 슬로건 검색
grep -r "대한민국 No.1" --include="*.tsx" --include="*.ts" app/ components/
```

---

## 주의사항

### DB 필드명은 변경하지 않음
다음 필드명들은 코드에서 사용되지만 DB 컬럼명이므로 변경하지 않습니다:
- `behind_story` (이슈 테이블의 비하인드 스토리 필드)

### 이메일 주소
- 관리자 이메일: `kr.behind@gmail.com` (변경 없이 유지 가능)
- 발신 이메일 도메인: 실제 서비스 도메인으로 변경 필요 (Resend 도메인 인증 필요)
