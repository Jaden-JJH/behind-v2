import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '이용약관 - Behind',
  description: 'Behind 서비스 이용약관',
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-2">Behind 서비스 이용약관</h1>
          <p className="text-muted-foreground mb-8">시행일: 2026년 1월 12일</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제1조 (목적)</h2>
            <p className="leading-relaxed text-foreground/90">
              본 약관은 스톤즈랩(이하 &quot;회사&quot;)이 제공하는 Behind 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제2조 (용어의 정의)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>&quot;서비스&quot;란 경제, 시사, 정치 등 뉴스 소식을 재해석하여 제공하는 정보 큐레이션 플랫폼을 의미합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li>&quot;회원&quot;이란 회사와 서비스 이용계약을 체결하고 이용자 아이디를 부여받은 자를 의미합니다.</li>
              <li>&quot;비하인드(Behind) 콘텐츠&quot;란 원 기사를 재해석하여 정보·맥락·감정선을 추가하여 제공하는 본 서비스의 독창적 콘텐츠를 의미합니다.</li>
              <li>&quot;원본 기사&quot;란 각 언론사가 작성한 뉴스 기사 원문을 의미합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력을 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우 회사는 변경사항을 시행일자 30일 전부터 서비스 내 공지사항을 통해 공지합니다.</li>
              <li>이용자가 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용할 경우 약관의 변경사항에 동의한 것으로 간주됩니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제4조 (회원가입 및 이용계약의 성립)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회원가입을 희망하는 자는 회사가 정한 가입 양식에 따라 회원정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청합니다.</li>
              <li>회사는 다음 각 호에 해당하지 않는 한 신청자를 회원으로 등록합니다:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                  <li>만 14세 미만인 경우</li>
                  <li>과거 회원 자격을 상실한 적이 있는 경우(단, 재가입 허가를 받은 경우는 예외)</li>
                  <li>기타 서비스 운영 및 기술상 지장이 있다고 판단되는 경우</li>
                </ul>
              </li>
              <li>회원가입계약의 성립시기는 회사의 승낙이 가입신청자에게 도달한 시점으로 합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제5조 (서비스의 제공)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사는 이용자에게 아래와 같은 서비스를 제공합니다:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>경제, 시사, 정치 등 뉴스 소식 재해석 콘텐츠 제공</li>
                  <li>커뮤니티 서비스 (토론, 댓글 등)</li>
                  <li>개인화 추천 서비스</li>
                  <li>검색 및 아카이브 서비스</li>
                  <li>기타 회사가 추가 개발하거나 제공하는 일체의 서비스</li>
                </ul>
              </li>
              <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
              <li>회사는 서비스의 내용 및 제공방식을 변경할 수 있으며, 중요한 변경사항은 사전에 공지합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제6조 (서비스의 중단)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사는 다음 각 호의 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>정보통신설비의 보수점검, 교체, 고장, 통신두절</li>
                  <li>천재지변, 국가비상사태 등 불가항력적 사유</li>
                  <li>서비스 개선을 위한 시스템 점검</li>
                  <li>기타 회사가 서비스 제공을 지속하는 것이 곤란한 경우</li>
                </ul>
              </li>
              <li>제1항의 경우 회사는 서비스 화면을 통해 사전 공지합니다. 다만, 사전 통지가 불가능한 긴급한 경우 사후에 통지할 수 있습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제7조 (콘텐츠의 저작권 및 이용)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li><strong>원본 기사의 저작권</strong>: 서비스 내 인용·참조되는 원본 기사의 저작권은 해당 언론사에 있으며, 회사는 저작권법 제28조(공표된 저작물의 인용)에 따라 정당한 범위 내에서 이를 인용합니다.</li>
              <li><strong>Behind 콘텐츠의 저작권</strong>: 회사가 작성한 재해석 콘텐츠(&quot;비하인드&quot;)의 저작권은 회사에 귀속됩니다.</li>
              <li><strong>콘텐츠 성격 고지</strong>:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>본 서비스의 &quot;비하인드&quot; 콘텐츠는 사실 보도와 무관한 해석·분석·창작 요소를 포함합니다.</li>
                  <li>사실 정보는 각 언론사의 원본 기사를 기준으로 하며, 모든 비하인드 콘텐츠에는 원문 출처가 명시됩니다.</li>
                  <li>비하인드 콘텐츠는 정보 재구성 및 맥락 제공을 목적으로 하며, 원본 기사의 단순 요약이 아닌 독창적 재해석입니다.</li>
                </ul>
              </li>
              <li><strong>이용자의 무단 배포 금지</strong>: 이용자는 서비스를 통해 제공받은 콘텐츠를 회사의 사전 승낙 없이 복제, 전송, 출판, 배포, 방송 기타 방법으로 영리목적으로 이용하거나 제3자에게 이용하게 할 수 없습니다.</li>
              <li><strong>이용자 게시물의 저작권</strong>:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>이용자가 서비스 내에 게시한 게시물의 저작권은 해당 이용자에게 귀속됩니다.</li>
                  <li>단, 회사는 서비스 운영, 개선, 홍보 목적으로 이용자 게시물을 무상으로 사용할 수 있습니다.</li>
                  <li>회사는 이용자 게시물을 서비스 외부에서 사용할 경우 사전에 이용자의 동의를 얻습니다.</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제8조 (원본 기사 출처 표시 및 링크)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>모든 비하인드 콘텐츠에는 참조한 원본 기사의 출처(언론사명, 기자명, 게재일시)를 명확히 표시합니다.</li>
              <li>원본 기사로 연결되는 링크를 제공하여 이용자가 원문을 직접 확인할 수 있도록 합니다.</li>
              <li>회사는 원본 기사의 수요를 대체하지 않으며, 오히려 원문 확인을 적극 권장합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제9조 (회원의 의무)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회원은 다음 각 호의 행위를 하여서는 안됩니다:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>회원가입 시 허위정보를 기재하는 행위</li>
                  <li>회사 및 제3자의 지적재산권을 침해하는 행위</li>
                  <li>타인의 개인정보를 무단으로 수집, 이용, 공개하는 행위</li>
                  <li>불법 정보(음란물, 명예훼손, 저작권 침해 등)를 게시하는 행위</li>
                  <li>스팸, 광고성 정보를 무단으로 전송하는 행위</li>
                  <li>허위사실을 유포하거나 타인을 비방하는 행위</li>
                  <li>서비스의 안정적 운영을 방해하는 행위</li>
                  <li>기타 관련 법령 또는 본 약관을 위반하는 행위</li>
                </ul>
              </li>
              <li>회원은 본 약관 및 관련 법령을 준수해야 하며, 이를 위반하여 발생한 모든 책임은 회원에게 있습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제10조 (게시물의 관리)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사는 다음 각 호에 해당하는 게시물을 사전 통지 없이 삭제하거나 이동 또는 등록 거부할 수 있습니다:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>타인의 명예를 훼손하거나 권리를 침해하는 내용</li>
                  <li>공서양속에 위반되는 내용</li>
                  <li>범죄행위와 관련된 내용</li>
                  <li>허위사실 또는 왜곡된 정보</li>
                  <li>동일한 내용의 반복 게시(도배)</li>
                  <li>저작권 등 타인의 권리를 침해하는 내용</li>
                  <li>기타 관련 법령 및 회사 정책에 위배되는 내용</li>
                </ul>
              </li>
              <li>회사는 게시물이 정보통신망법 및 저작권법 등 관련 법령에 위배된다고 판단되는 경우, 관련 법령에 따라 임시조치 등을 취할 수 있습니다.</li>
              <li>권리 침해를 주장하는 자는 회사에 해당 게시물의 삭제 또는 반박 내용의 게재를 요청할 수 있으며, 회사는 관련 법령에 따라 조치합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제11조 (허위·조작 정보에 대한 책임)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>이용자는 허위사실이나 조작된 정보를 게시하거나 유포해서는 안됩니다.</li>
              <li>이용자가 고의 또는 중과실로 허위·조작 정보를 유통하여 타인에게 손해를 입힌 경우, 정보통신망법 제70조의2에 따라 손해배상 책임을 부담할 수 있습니다.</li>
              <li>회사는 이용자가 게시한 정보의 진위 여부를 검증할 의무가 없으며, 이용자 게시물로 인한 법적 분쟁에 대해 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제12조 (개인정보보호)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.</li>
              <li>개인정보의 수집, 이용, 제공, 관리 등에 관한 사항은 별도의 <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>에 따릅니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제13조 (회사의 의무)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사는 관련 법령과 본 약관을 준수하며, 계속적이고 안정적인 서비스 제공을 위해 노력합니다.</li>
              <li>회사는 이용자의 개인정보 보호를 위해 보안시스템을 구축하고 관리합니다.</li>
              <li>회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 인정될 경우 신속히 처리합니다.</li>
              <li>회사는 이용자가 원하지 않는 영리목적의 광고성 전자우편을 발송하지 않습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제14조 (회사의 면책)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 게시 또는 전송한 정보, 자료, 사실의 신뢰도, 정확성 등에 대해서는 책임을 지지 않습니다.</li>
              <li>회사는 원본 기사의 내용에 대해 책임을 지지 않으며, 비하인드 콘텐츠는 해석·분석의 성격을 가진 2차 창작물임을 명시합니다.</li>
              <li>회사는 이용자 상호간 또는 이용자와 제3자 상호간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며 이로 인한 손해를 배상할 책임도 없습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제15조 (회원 탈퇴 및 자격 상실)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회원은 언제든지 회원 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴 처리를 합니다.</li>
              <li>회원이 다음 각 호에 해당하는 경우, 회사는 사전 통지 후 회원 자격을 제한, 정지 또는 상실시킬 수 있습니다:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>가입 신청 시 허위 내용을 등록한 경우</li>
                  <li>타인의 서비스 이용을 방해하거나 정보를 도용한 경우</li>
                  <li>관련 법령 또는 본 약관을 위반한 경우</li>
                  <li>1년 이상 서비스를 이용하지 않은 경우</li>
                </ul>
              </li>
              <li>회원 탈퇴 시 회원의 개인 게시물은 삭제되지 않으며, 탈퇴 후에는 게시물 삭제가 불가능합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제16조 (손해배상)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사 또는 이용자는 본 약관을 위반하여 상대방에게 손해를 입힌 경우 그 손해를 배상할 책임이 있습니다.</li>
              <li>단, 회사는 무료로 제공하는 서비스 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제17조 (광고게재)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사는 서비스 운영과 관련하여 서비스 화면, 이메일 등에 광고를 게재할 수 있습니다.</li>
              <li>이용자가 광고를 통해 제3자가 제공하는 서비스나 상품을 이용하는 과정에서 발생한 손해에 대해 회사는 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제18조 (분쟁의 해결)</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
              <li>회사와 이용자 간 발생한 분쟁에 대해서는 대한민국 법을 적용합니다.</li>
              <li>서비스 이용으로 발생한 분쟁에 대한 소송은 민사소송법상의 관할법원에 제기합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">제19조 (약관 외 준칙)</h2>
            <p className="leading-relaxed text-foreground/90">
              본 약관에 명시되지 않은 사항은 정보통신망법, 저작권법, 전자상거래법 등 관련 법령 및 회사의 서비스 별 세부 이용지침에 따릅니다.
            </p>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm font-semibold text-foreground/80">부칙</p>
            <p className="text-sm text-muted-foreground mt-2">본 약관은 2026년 1월 12일부터 적용됩니다.</p>
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
