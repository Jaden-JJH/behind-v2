import { Resend } from 'resend'

// Resend 클라이언트 초기화
const resend = new Resend(process.env.RESEND_API_KEY)

export interface ReportEmailData {
  contentType: 'issue' | 'poll' | 'comment'
  contentId: string
  contentTitle?: string
  contentPreview?: string
  reportCount: number
  reportReason: string
  reporterNick: string
  reportedAt: string
}

/**
 * 관리자에게 신고 알림 이메일 발송
 * 3회 누적 신고 시 호출됨
 */
export async function sendReportNotificationToAdmin(data: ReportEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('ADMIN_EMAIL environment variable is not set')
    return { success: false, error: 'Admin email not configured' }
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set')
    return { success: false, error: 'Resend API key not configured' }
  }

  const contentTypeKo = {
    issue: '이슈',
    poll: 'Poll 투표',
    comment: '댓글'
  }[data.contentType]

  const subject = `🚨 [긴급] ${contentTypeKo} 신고 ${data.reportCount}회 누적 - 검토 필요`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      background-color: #dc2626;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin: -30px -30px 20px -30px;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
    }
    .alert-badge {
      background-color: #fef2f2;
      color: #dc2626;
      padding: 8px 16px;
      border-radius: 4px;
      display: inline-block;
      font-weight: 600;
      margin: 10px 0;
    }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
      text-align: right;
    }
    .content-preview {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .action-button {
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      display: inline-block;
      margin: 10px 5px;
      font-weight: 600;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .warning-text {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 콘텐츠 신고 알림</h1>
    </div>

    <div class="alert-badge">
      신고 ${data.reportCount}회 누적 - 관리자 검토 필요
    </div>

    <p>안녕하세요, 이슈위키 관리자님.</p>
    <p><strong>${contentTypeKo}</strong> 콘텐츠가 <strong>${data.reportCount}회</strong> 신고되어 관리자 검토가 필요합니다.</p>

    <div class="info-section">
      <div class="info-row">
        <span class="info-label">콘텐츠 유형</span>
        <span class="info-value">${contentTypeKo}</span>
      </div>
      <div class="info-row">
        <span class="info-label">콘텐츠 ID</span>
        <span class="info-value"><code>${data.contentId}</code></span>
      </div>
      <div class="info-row">
        <span class="info-label">신고 횟수</span>
        <span class="info-value"><strong style="color: #dc2626;">${data.reportCount}회</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">최근 신고 사유</span>
        <span class="info-value">${data.reportReason}</span>
      </div>
      <div class="info-row">
        <span class="info-label">최근 신고자</span>
        <span class="info-value">${data.reporterNick}</span>
      </div>
      <div class="info-row">
        <span class="info-label">신고 시간</span>
        <span class="info-value">${data.reportedAt}</span>
      </div>
    </div>

    ${data.contentTitle ? `
    <div class="content-preview">
      <strong>📌 콘텐츠 제목:</strong><br>
      ${data.contentTitle}
    </div>
    ` : ''}

    ${data.contentPreview ? `
    <div class="content-preview">
      <strong>📄 콘텐츠 미리보기:</strong><br>
      ${data.contentPreview.substring(0, 200)}${data.contentPreview.length > 200 ? '...' : ''}
    </div>
    ` : ''}

    <div class="warning-text">
      ⚠️ <strong>처리 안내:</strong> 신고된 콘텐츠를 검토하신 후, 관리자 대시보드에서 블라인드 처리 또는 신고 기각 결정을 내려주세요.
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/reports" class="action-button">
        관리자 대시보드에서 확인하기
      </a>
    </div>

    <div class="footer">
      <p>이 이메일은 이슈위키 신고 시스템에서 자동으로 발송되었습니다.</p>
      <p>정보통신망법 및 개인정보보호법에 따라 신고 내역이 기록되며, 24시간 내 검토가 권장됩니다.</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'IssueWiki Reports <reports@issuewiki.com>', // TODO: 실제 도메인으로 변경 필요
      to: adminEmail,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error.message }
    }

    console.log('Report notification email sent:', emailData?.id)
    return { success: true, emailId: emailData?.id }
  } catch (error) {
    console.error('Unexpected error sending email:', error)
    return { success: false, error: 'Unexpected error' }
  }
}

/**
 * 이메일 전송 테스트 함수 (개발용)
 */
export async function sendTestEmail(toEmail: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set')
    return { success: false, error: 'Resend API key not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'IssueWiki <test@issuewiki.com>',
      to: toEmail,
      subject: 'Test Email from IssueWiki',
      html: '<p>This is a test email from IssueWiki reporting system.</p>',
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (error) {
    return { success: false, error: 'Unexpected error' }
  }
}
