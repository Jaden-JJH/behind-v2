# 환경변수 설정 가이드

## 신고 시스템 설정을 위한 환경변수

신고 시스템이 정상적으로 작동하려면 다음 환경변수를 `.env.local` 파일에 추가해야 합니다.

## 1. Resend API 키 설정

신고가 3회 누적되었을 때 관리자에게 이메일을 발송하기 위해 Resend 서비스를 사용합니다.

### Resend 가입 및 API 키 발급

1. [Resend](https://resend.com) 웹사이트 방문
2. 무료 계획으로 가입 (월 3,000통 무료)
3. API Keys 메뉴에서 새 API 키 생성
4. 생성된 API 키 복사

### .env.local에 추가

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 발신자 도메인 설정 (선택)

Resend에서 더 나은 전달률을 위해 자체 도메인을 인증할 수 있습니다:
1. Resend 대시보드 → Domains 메뉴
2. Add Domain 클릭
3. 안내에 따라 DNS 레코드 추가
4. 인증 완료 후 `lib/email.ts` 파일에서 발신자 이메일 수정:

```typescript
// lib/email.ts 수정
from: 'Behind Reports <reports@yourdomain.com>', // 인증된 도메인으로 변경
```

**참고**: 도메인 인증 없이는 `onboarding@resend.dev` 같은 테스트 이메일로만 발송됩니다.

---

## 2. 관리자 이메일 주소 설정

신고 알림을 받을 관리자 이메일 주소를 설정합니다.

```env
# Admin Email
ADMIN_EMAIL=kr.behind@gmail.com
```

**주의**: 이 이메일로 3회 이상 신고된 콘텐츠에 대한 알림이 발송됩니다.

---

## 3. 전체 .env.local 예시

```env
# Supabase (기존)
NEXT_PUBLIC_SUPABASE_URL=https://gknekrinduypcrzholam.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin (기존)
ADMIN_PASSWORD=JDJiJDEwJC...

# App URL (기존)
NEXT_PUBLIC_APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Redis (기존)
UPSTASH_REDIS_REST_URL=https://kind-sparrow-31930.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Resend Email Service (신규 추가)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Admin Email (신규 추가)
ADMIN_EMAIL=kr.behind@gmail.com
```

---

## 4. 환경변수 확인 방법

애플리케이션 시작 시 환경변수가 올바르게 설정되었는지 확인할 수 있습니다:

```bash
# 개발 서버 시작
npm run dev

# 콘솔 로그에서 확인
# - RESEND_API_KEY가 설정되지 않으면 경고 메시지 표시
# - ADMIN_EMAIL이 설정되지 않으면 이메일 발송 시 에러 로그 표시
```

---

## 5. 프로덕션 환경 설정

### Vercel 배포 시

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   - `RESEND_API_KEY`: Resend API 키
   - `ADMIN_EMAIL`: 관리자 이메일 주소

4. Redeploy 실행

### 기타 플랫폼

- **Netlify**: Site settings → Build & deploy → Environment
- **Railway**: 프로젝트 → Variables
- **Render**: Dashboard → Environment

---

## 6. 보안 주의사항

⚠️ **중요**: 다음 사항을 반드시 준수하세요.

1. **절대 커밋하지 마세요**
   - `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다
   - API 키나 비밀 정보를 GitHub에 올리지 마세요

2. **API 키 관리**
   - Resend API 키는 주기적으로 재생성하세요
   - 의심스러운 활동 발견 시 즉시 키를 재발급하세요

3. **이메일 발송 제한**
   - Resend 무료 플랜: 월 3,000통
   - 대량 신고 시 이메일 발송 로직 최적화 필요

---

## 7. 테스트 방법

### 로컬 환경에서 이메일 발송 테스트

1. 환경변수 설정 완료
2. 개발 서버 시작: `npm run dev`
3. 로그인 후 임의의 콘텐츠 신고
4. 다른 계정으로 같은 콘텐츠를 2회 더 신고 (총 3회)
5. 관리자 이메일 수신 확인

### 이메일이 오지 않는 경우

1. **환경변수 확인**
   ```bash
   echo $RESEND_API_KEY
   echo $ADMIN_EMAIL
   ```

2. **서버 로그 확인**
   - 콘솔에 "Failed to send email" 에러가 있는지 확인
   - Resend API 응답 에러 메시지 확인

3. **Resend 대시보드 확인**
   - [Resend Logs](https://resend.com/emails) 페이지에서 발송 내역 확인
   - 실패한 이메일의 에러 메시지 확인

4. **스팸 폴더 확인**
   - 이메일이 스팸 폴더로 갔을 수 있음
   - 도메인 인증 없이는 스팸으로 분류될 가능성 높음

---

## 8. 문제 해결 (Troubleshooting)

### "RESEND_API_KEY environment variable is not set" 에러

**원인**: Resend API 키가 설정되지 않음

**해결**:
1. `.env.local` 파일 확인
2. `RESEND_API_KEY=re_...` 추가
3. 서버 재시작 (`npm run dev` 재실행)

### "ADMIN_EMAIL environment variable is not set" 에러

**원인**: 관리자 이메일이 설정되지 않음

**해결**:
1. `.env.local` 파일 확인
2. `ADMIN_EMAIL=your-email@example.com` 추가
3. 서버 재시작

### 이메일 발송은 되지만 받지 못하는 경우

**원인**:
- 잘못된 이메일 주소
- 스팸 필터
- Resend 전송 제한

**해결**:
1. `ADMIN_EMAIL` 주소 확인
2. 스팸 폴더 확인
3. Resend 대시보드에서 전송 로그 확인
4. Resend 무료 플랜 한도 (월 3,000통) 확인

---

## 9. 추가 설정 (선택)

### 이메일 템플릿 커스터마이징

`lib/email.ts` 파일에서 이메일 내용을 수정할 수 있습니다:

```typescript
// lib/email.ts
const html = `
<!DOCTYPE html>
<html>
  ... (여기서 HTML 템플릿 수정 가능)
</html>
`
```

### 발송 조건 변경

3회 신고 대신 다른 조건으로 변경하려면:

```typescript
// app/api/content-reports/route.ts

// 현재: 3회 이상 시 발송
if (totalReports >= 3) {
  sendReportNotificationToAdmin(...)
}

// 변경 예시: 5회 이상
if (totalReports >= 5) {
  sendReportNotificationToAdmin(...)
}
```

---

## 10. 요약 체크리스트

설정 완료 전 확인사항:

- [ ] Resend 계정 생성 완료
- [ ] RESEND_API_KEY를 .env.local에 추가
- [ ] ADMIN_EMAIL을 .env.local에 추가
- [ ] 개발 서버 재시작 완료
- [ ] 테스트 신고로 이메일 수신 확인
- [ ] 프로덕션 환경에 환경변수 설정 (Vercel 등)
- [ ] .gitignore에 .env.local 포함 확인

---

**문의**: 설정 중 문제가 발생하면 개발팀에 문의하세요.
- 관리자 이메일: kr.behind@gmail.com
- Resend 문서: https://resend.com/docs
