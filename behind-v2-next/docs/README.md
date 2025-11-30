# Behind v2 - 문서 가이드

**상태**: ✅ Phase 1-3 + 메인 노출 관리 완료  
**마지막 업데이트**: 2025-11-30

---

## 🚀 시작하기

### 1️⃣ 지금 상황을 알고 싶다면
👉 **[HANDOVER.md](./HANDOVER.md)** 읽기
- 현재 완료된 작업
- 남은 작업 (실시간 인기 이슈만)
- 필수 정보 한 곳에 정리

### 2️⃣ 개발 규칙을 알고 싶다면
👉 **[DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md)** 읽기
- 네이밍 컨벤션
- DB 스키마 확인 방법
- 개발 체크리스트

### 3️⃣ 작업 이력을 보고 싶다면
👉 **[archive/SESSION_HISTORY.md](./archive/SESSION_HISTORY.md)** 읽기 (선택)
- 세션별 작업 내역
- 버그 수정 상세
- 참고용 문서

---

## 📚 참고 문서

| 문서 | 용도 |
|------|------|
| **HANDOVER.md** | ⭐ 최종 인수인계 (필수) |
| **DEVELOPMENT_NOTES.md** | ⭐ 개발 규칙 (필수) |
| **ADMIN_GUIDE.md** | 관리자 가이드 (선택) |
| **archive/SESSION_HISTORY.md** | 작업 이력 (참고용) |
| **archive/MYPAGE_IMPLEMENTATION_PLAN.md** | Phase 계획 (완료됨) |

---

## ⚡ 빠른 시작

### 개발 서버 실행
```bash
npm run dev
# http://localhost:3001
```

### 주요 페이지
- 마이페이지: http://localhost:3001/my
- 어드민: http://localhost:3001/admin
- 메인: http://localhost:3001

### API 테스트
```javascript
// 브라우저 콘솔
const res = await fetch('/api/my/votes?page=1&limit=20&filter=all')
console.log(await res.json())
```

---

## 🎯 완료 상태

### ✅ 완료된 Phase
- **Phase 1**: 기본 마이페이지 (100%)
- **Phase 2**: 이슈 팔로우 (100%)
- **Phase 3.1**: 참여한 채팅방 (100%)
- **Phase 3.2**: 사용자 프로필 (100%)
- **Phase 3.3**: 계정 관리 (100%)
- **메인 노출 관리**: 어드민 설정 UI (100%)

### 🔄 선택적 작업
- **실시간 인기 이슈**: 현재 하드코딩, 향후 API 연동 가능

### ⏸️ 보류된 Phase
- **Phase 4**: 알림 시스템 (선택)
- **Phase 5**: 소셜 기능 (선택)

---

## 🚀 프로덕션 배포

**도메인:** https://behind-beta.vercel.app

**환경:**
- Next.js 15.5.4
- Supabase
- Vercel
- Upstash Redis

**배포 완료:** 2025-11-30

---

## 📝 남은 작업

1. **실시간 인기 이슈 (선택적)**
   - 홈페이지 하드코딩 제거
   - API 연동
   - 예상 소요: 3-4시간

2. **디버깅 로그 제거 (배포 전)**
   - `app/my/votes/page.tsx`
   - `hooks/useFetchWithRetry.ts`

---

**다음**: [HANDOVER.md](./HANDOVER.md)에서 전체 상황 확인하기