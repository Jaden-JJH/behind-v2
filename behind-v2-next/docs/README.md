# Behind v2 마이페이지 - 문서 가이드

**상태**: ✅ Phase 1 완료  
**마지막 업데이트**: 2025-11-24

---

## 🚀 시작하기

### 1️⃣ 지금 상황을 알고 싶다면
👉 **[HANDOVER.md](./HANDOVER.md)** 읽기
- 현재 완료된 작업
- 다음 단계 (Phase 2)
- 필수 정보 한 곳에 정리

### 2️⃣ 기술 상세를 알고 싶다면
👉 **[CURRENT_STATUS.md](./CURRENT_STATUS.md)** 읽기
- 기술적 상세 정보
- 최적화 사항
- 문제 해결 방법

### 3️⃣ 개발 규칙을 알고 싶다면
👉 **[DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md)** 읽기
- 네이밍 컨벤션
- DB 스키마
- 개발 체크리스트

---

## 📚 참고 문서

| 문서 | 용도 |
|------|------|
| **MYPAGE_IMPLEMENTATION_PLAN.md** | Phase 2~5 전체 로드맵 |
| **ADMIN_GUIDE.md** | 어드민 기능 (선택) |

---

## ⚡ 빠른 시작

### 개발 서버 실행
```bash
npm run dev
http://localhost:3001/my
```

### API 테스트
```javascript
// 브라우저 콘솔
const res = await fetch('/api/my/votes?page=1&limit=20&filter=all')
console.log(await res.json())
```

---

## 🎯 상태

- ✅ Phase 1: 100% 완료
- 🚀 Phase 2: 준비 중 (이슈 팔로우)

---

**다음**: HANDOVER.md에서 전체 상황 확인하기
