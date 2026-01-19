import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '개인정보처리방침 - 이슈위키',
  description: '이슈위키 개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              돌아가기
            </Button>
          </Link>
        </div>

        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">이슈위키 개인정보처리방침</h1>
          <p className="text-muted-foreground mb-8">시행일: 2026년 1월 9일</p>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <p className="text-sm leading-relaxed text-foreground/90 m-0">
              <strong>스톤즈랩</strong>(이하 &quot;회사&quot;)는 이용자의 개인정보를 매우 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 철저히 준수합니다.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제1조 (개인정보의 수집 항목 및 방법)</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">1. 수집하는 개인정보 항목</h3>
            <p className="text-foreground/90 mb-4">회사는 서비스 제공을 위해 최소한의 개인정보만을 수집합니다.</p>

            <div className="mb-4">
              <p className="font-semibold text-foreground/90 mb-2">[회원가입 시 수집 항목]</p>
              <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                <li>필수항목: 이메일 주소, 비밀번호, 닉네임</li>
                <li>선택항목: 프로필 이미지</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-foreground/90 mb-2">[서비스 이용 과정에서 자동 수집되는 정보]</p>
              <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                <li>서비스 이용 기록, 접속 로그, IP 주소</li>
                <li>기기 정보(OS 버전, 브라우저 종류 및 버전, 단말기 모델명)</li>
                <li>쿠키, 접속 일시, 이용 기록</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-foreground/90 mb-2">[콘텐츠 작성 시]</p>
              <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                <li>게시글, 댓글, 토론 내용 등 이용자가 직접 입력한 정보</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">2. 개인정보 수집 방법</h3>
            <ul className="list-disc pl-6 space-y-1 text-foreground/90">
              <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
              <li>서비스 이용 과정에서 자동으로 생성·수집</li>
              <li>쿠키 등 자동 수집 장치를 통한 수집</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3. 만 14세 미만 아동의 개인정보</h3>
            <p className="text-foreground/90">
              회사는 만 14세 미만 아동의 회원가입을 제한하고 있습니다. 만 14세 미만 아동이 회원가입을 시도하는 경우 법정대리인의 동의를 받아야 하며, 법정대리인의 동의 여부 확인을 위해 법정대리인의 본인확인정보(CI값)를 수집할 수 있습니다. 수집된 법정대리인 정보는 동의 여부 확인 후 즉시 파기됩니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="text-foreground/90 mb-4">
              회사는 수집한 개인정보를 다음의 목적으로만 이용하며, 목적이 변경될 경우 사전에 이용자의 동의를 구합니다.
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground/90 mb-2">1. 회원 관리</p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>회원제 서비스 이용에 따른 본인 확인, 개인 식별</li>
                  <li>불량회원의 부정 이용 방지 및 비인가 사용 방지</li>
                  <li>가입 의사 확인, 연령 확인</li>
                  <li>불만 처리, 민원 처리, 고지사항 전달</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground/90 mb-2">2. 서비스 제공</p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>경제, 시사, 정치 등 뉴스 콘텐츠 재해석 서비스 제공</li>
                  <li>맞춤형 콘텐츠 추천</li>
                  <li>커뮤니티 서비스(게시판, 댓글, 토론) 제공</li>
                  <li>신규 서비스 개발 및 제공</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground/90 mb-2">3. 서비스 개선 및 통계 분석</p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>서비스 이용 통계 및 분석</li>
                  <li>서비스 품질 향상 및 개선</li>
                  <li>연령별·관심사별 맞춤 서비스 제공</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground/90 mb-2">4. 마케팅 및 광고</p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>이벤트 및 프로모션 정보 제공(선택 동의 시)</li>
                  <li>서비스 관련 공지사항 전달</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <p className="text-foreground/90 mb-4">
              회사는 이용자의 개인정보를 수집·이용 목적이 달성된 후에는 지체 없이 파기합니다. 단, 다음의 경우 명시한 기간 동안 보관합니다.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">1. 회원 탈퇴 시</h3>
            <p className="text-foreground/90">회원 탈퇴 즉시 개인정보를 파기합니다. 단, 아래의 경우 예외로 합니다:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">2. 내부 방침에 의한 정보 보유</h3>
            <ul className="list-disc pl-6 space-y-1 text-foreground/90">
              <li><strong>부정 이용 방지</strong>: 부정 이용 기록은 최대 3개월 보관 후 파기</li>
              <li><strong>불법 게시물 기록</strong>: 불법·음란·명예훼손 게시물 기록은 3개월 보관 후 파기</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3. 관련 법령에 의한 정보 보유</h3>
            <p className="text-foreground/90 mb-2">
              「전자상거래 등에서의 소비자보호에 관한 법률」, 「통신비밀보호법」 등 관련 법령에 따라 일정 기간 보관해야 하는 경우:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-foreground/90">
              <li><strong>계약 또는 청약철회 등에 관한 기록</strong>: 5년 (전자상거래법)</li>
              <li><strong>대금결제 및 재화 등의 공급에 관한 기록</strong>: 5년 (전자상거래법)</li>
              <li><strong>소비자의 불만 또는 분쟁 처리에 관한 기록</strong>: 3년 (전자상거래법)</li>
              <li><strong>표시·광고에 관한 기록</strong>: 6개월 (전자상거래법)</li>
              <li><strong>서비스 이용 관련 개인정보(로그 기록, IP)</strong>: 3개월 (통신비밀보호법)</li>
              <li><strong>불법촬영물 등 신고 관련 정보</strong>: 3년 (전기통신사업법)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제4조 (개인정보의 제3자 제공)</h2>
            <p className="text-foreground/90 mb-4">
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.
            </p>
            <ol className="list-decimal pl-6 space-y-1 text-foreground/90">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>이용자의 생명이나 안전에 급박한 위험이 확인되어 이를 해소하기 위한 경우</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제5조 (개인정보 처리의 위탁)</h2>
            <p className="text-foreground/90 mb-4">
              회사는 서비스 향상을 위해 다음과 같이 개인정보 처리 업무를 외부 전문업체에 위탁하고 있습니다.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">수탁업체</th>
                    <th className="border border-border px-4 py-2 text-left">위탁업무 내용</th>
                    <th className="border border-border px-4 py-2 text-left">보유 및 이용 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">Google LLC</td>
                    <td className="border border-border px-4 py-2">데이터 보관 및 서버 운영</td>
                    <td className="border border-border px-4 py-2">위탁계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">Google LLC, 카카오디벨로퍼스</td>
                    <td className="border border-border px-4 py-2">본인 확인 및 인증</td>
                    <td className="border border-border px-4 py-2">회원 탈퇴 시 또는 위탁계약 종료 시까지</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-foreground/90 mt-4">
              회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제6조 (개인정보의 파기 절차 및 방법)</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">1. 파기 절차</h3>
            <p className="text-foreground/90">
              이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정 기간 저장된 후 파기됩니다. 별도 DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 다른 목적으로 이용되지 않습니다.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">2. 파기 방법</h3>
            <ul className="list-disc pl-6 space-y-1 text-foreground/90">
              <li><strong>전자적 파일</strong>: 복구 및 재생이 불가능한 기술적 방법으로 완전 삭제</li>
              <li><strong>종이 문서</strong>: 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제7조 (이용자의 권리와 행사 방법)</h2>
            <p className="text-foreground/90 mb-4">
              이용자 및 법정대리인은 언제든지 다음과 같은 권리를 행사할 수 있습니다.
            </p>

            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li><strong>개인정보 열람 요구</strong>: 이용자는 자신의 개인정보에 대한 열람을 요구할 수 있습니다.</li>
              <li><strong>개인정보 정정·삭제 요구</strong>: 이용자는 자신의 개인정보에 오류가 있는 경우 정정 또는 삭제를 요구할 수 있습니다.</li>
              <li><strong>개인정보 처리 정지 요구</strong>: 이용자는 자신의 개인정보 처리 정지를 요구할 수 있습니다.</li>
              <li><strong>개인정보 전송 요구</strong>: 이용자는 개인정보 보호법 제35조의2에 따라 자신의 개인정보를 다른 사업자에게 전송할 것을 요구할 수 있습니다.</li>
              <li><strong>자동화된 결정에 대한 거부</strong>: 회사가 인공지능 등을 이용하여 자동화된 결정을 하는 경우, 이용자는 이를 거부하거나 해당 결정에 대한 설명을 요구할 수 있습니다.</li>
            </ol>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold text-foreground/90 mb-2">권리 행사 방법</p>
              <p className="text-sm text-foreground/80">
                위 권리는 서비스 내 &apos;마이페이지&apos;에서 직접 행사하거나, 개인정보보호 책임자에게 서면, 이메일, 팩스 등을 통해 요청할 수 있으며, 회사는 지체 없이 조치하겠습니다.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제8조 (개인정보의 안전성 확보 조치)</h2>
            <p className="text-foreground/90 mb-4">
              회사는 이용자의 개인정보를 안전하게 관리하기 위해 다음과 같은 기술적·관리적·물리적 조치를 취하고 있습니다.
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground/90 mb-2">1. 기술적 조치</p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>개인정보의 암호화: 비밀번호는 암호화되어 저장 및 관리</li>
                  <li>해킹 등에 대비한 대책: 방화벽 및 침입탐지시스템 설치·운영</li>
                  <li>백신 프로그램: 주기적 업데이트 및 검사 실시</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground/90 mb-2">2. 관리적 조치</p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>개인정보 취급 직원의 최소화 및 교육</li>
                  <li>내부관리계획 수립 및 시행</li>
                  <li>개인정보 취급자의 접근 권한 관리</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-foreground/90 mb-2">3. 물리적 조치</p>
                <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                  <li>개인정보 보관 장소에 대한 접근 통제</li>
                  <li>잠금장치 설치</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제9조 (쿠키의 운영 및 거부)</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">1. 쿠키의 사용 목적</h3>
            <p className="text-foreground/90 mb-2">회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키(Cookie)를 사용합니다.</p>
            <ul className="list-disc pl-6 space-y-1 text-foreground/90">
              <li>이용자의 접속 빈도, 방문 시간, 이용 형태 분석</li>
              <li>맞춤형 콘텐츠 추천</li>
              <li>서비스 개선 및 통계 분석</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2. 쿠키의 설치·운영 및 거부 방법</h3>
            <p className="text-foreground/90 mb-2">이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다.</p>

            <div className="mt-4">
              <p className="font-semibold text-foreground/90 mb-2">[웹 브라우저 설정]</p>
              <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                <li>Chrome: 설정 &gt; 개인정보 및 보안 &gt; 쿠키 및 기타 사이트 데이터</li>
                <li>Edge: 설정 &gt; 쿠키 및 사이트 권한</li>
                <li>Safari: 환경설정 &gt; 개인정보 &gt; 쿠키 및 웹사이트 데이터</li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-foreground/90 mb-2">[모바일 기기 설정]</p>
              <ul className="list-disc pl-6 space-y-1 text-foreground/90">
                <li>Android: 설정 &gt; Google &gt; 광고 &gt; 광고 개인 최적화 선택 해제</li>
                <li>iOS: 설정 &gt; 개인정보 보호 &gt; 추적 &gt; 앱이 추적을 요청하도록 허용 해제</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              단, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 있을 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제10조 (개인정보보호 책임자 및 담당 부서)</h2>
            <p className="text-foreground/90 mb-4">
              회사는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 개인정보보호 책임자 및 담당 부서를 지정하고 있습니다.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-foreground/90 mb-3">[개인정보보호 책임자]</p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  <li><strong>성명:</strong> 정진협</li>
                  <li><strong>직위:</strong> 대표</li>
                  <li><strong>이메일:</strong> kr.behind@gmail.com</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-foreground/90 mb-3">[개인정보보호 담당 부서]</p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  <li><strong>담당자:</strong> 정진협</li>
                  <li><strong>이메일:</strong> kr.behind@gmail.com</li>
                </ul>
              </div>
            </div>

            <p className="text-foreground/90 mt-4">
              이용자는 회사의 서비스를 이용하며 발생하는 모든 개인정보보호 관련 민원을 개인정보보호 책임자 또는 담당 부서로 신고할 수 있습니다. 회사는 이용자의 신고사항에 대해 신속하고 충분한 답변을 드릴 것입니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제11조 (권익침해 구제 방법)</h2>
            <p className="text-foreground/90 mb-4">
              이용자는 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁 해결이나 상담 등을 신청할 수 있습니다.
            </p>

            <ul className="space-y-2 text-foreground/90">
              <li><strong>개인정보분쟁조정위원회:</strong> (국번 없이) 1833-6972 (www.kopico.go.kr)</li>
              <li><strong>개인정보침해신고센터:</strong> (국번 없이) 118 (privacy.kisa.or.kr)</li>
              <li><strong>대검찰청 사이버범죄수사단:</strong> (국번 없이) 1301 (www.spo.go.kr)</li>
              <li><strong>경찰청 사이버안전국:</strong> (국번 없이) 182 (ecrm.police.go.kr)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제12조 (개인정보처리방침의 변경)</h2>
            <p className="text-foreground/90">
              본 개인정보처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 경우 변경 사항의 시행 7일 전부터 서비스 내 공지사항을 통해 고지할 것입니다.
            </p>
            <p className="text-foreground/90 mt-2">
              다만, 수집하는 개인정보의 항목, 이용 목적의 변경 등과 같이 이용자 권리의 중대한 변경이 발생할 때에는 최소 30일 전에 공지하며, 필요 시 이용자 동의를 다시 받을 수도 있습니다.
            </p>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm font-semibold text-foreground/80">부칙</p>
            <p className="text-sm text-muted-foreground mt-2">본 개인정보처리방침은 2026년 1월 9일부터 적용됩니다.</p>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">개인정보처리방침 개정 이력</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">버전</th>
                    <th className="border border-border px-4 py-2 text-left">시행일자</th>
                    <th className="border border-border px-4 py-2 text-left">주요 변경 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">1.0</td>
                    <td className="border border-border px-4 py-2">2026.01.09</td>
                    <td className="border border-border px-4 py-2">최초 제정</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 p-6 bg-muted rounded-lg">
            <p className="text-sm text-foreground/80">
              <strong>문의</strong><br />
              이메일: kr.behind@gmail.com<br />
              운영사: 스톤즈랩
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
