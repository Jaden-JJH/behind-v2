-- Content Reports System Migration
-- 신고 시스템 구현을 위한 데이터베이스 스키마

-- 1. 신고 내역 테이블
CREATE TABLE IF NOT EXISTS content_reports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Information
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('issue', 'poll', 'comment')),
  content_id UUID NOT NULL,

  -- Reporter Information
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_nick VARCHAR(50) NOT NULL,
  reporter_ip VARCHAR(45), -- IPv4/IPv6 지원

  -- Report Details
  reason VARCHAR(50) NOT NULL CHECK (reason IN (
    '욕설/비방/혐오 표현',
    '허위사실 유포',
    '명예훼손/모욕',
    '개인정보 노출',
    '음란물/불건전 콘텐츠',
    '광고/스팸',
    '기타'
  )),
  reason_detail TEXT, -- '기타' 선택 시 상세 사유 (최대 200자)

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100), -- 관리자 식별자
  review_note TEXT, -- 관리자 검토 메모

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicate reports
  CONSTRAINT unique_user_content_report UNIQUE (reporter_id, content_type, content_id)
);

-- 2. 신고 카운트 및 블라인드 상태를 위한 컬럼 추가

-- Issues 테이블에 블라인드 관련 컬럼 추가
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS is_blinded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blinded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS blinded_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Polls 테이블에 블라인드 관련 컬럼 추가
ALTER TABLE polls
ADD COLUMN IF NOT EXISTS is_blinded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blinded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS blinded_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Comments 테이블에 블라인드 관련 컬럼 추가
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_blinded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blinded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS blinded_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issues_is_blinded ON issues(is_blinded);
CREATE INDEX IF NOT EXISTS idx_polls_is_blinded ON polls(is_blinded);
CREATE INDEX IF NOT EXISTS idx_comments_is_blinded ON comments(is_blinded);

-- 4. Row Level Security (RLS) Policies

-- Enable RLS on content_reports
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 신고 내역만 볼 수 있음
CREATE POLICY "Users can view their own reports"
  ON content_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- 로그인한 사용자는 신고를 생성할 수 있음
CREATE POLICY "Authenticated users can create reports"
  ON content_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 관리자만 모든 신고를 조회하고 업데이트할 수 있음 (서비스 롤 키 사용)
-- Note: API에서 supabaseAdmin (service role key)을 사용하면 RLS를 자동으로 우회하므로
-- 이 정책은 실제로는 사용되지 않습니다. 명시적인 문서화 목적으로 포함되었습니다.
CREATE POLICY "Service role can manage all reports"
  ON content_reports
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Comments for documentation
COMMENT ON TABLE content_reports IS '콘텐츠 신고 내역 (이슈, Poll, 댓글)';
COMMENT ON COLUMN content_reports.content_type IS '신고 대상 콘텐츠 타입: issue, poll, comment';
COMMENT ON COLUMN content_reports.content_id IS '신고 대상 콘텐츠의 ID';
COMMENT ON COLUMN content_reports.reason IS '신고 사유 (7가지 정해진 옵션)';
COMMENT ON COLUMN content_reports.reason_detail IS '기타 선택 시 상세 사유 (최대 200자)';
COMMENT ON COLUMN content_reports.status IS '처리 상태: pending(대기), approved(승인-블라인드), rejected(기각)';
COMMENT ON COLUMN content_reports.reporter_ip IS '신고자 IP (법적 대응용)';

COMMENT ON COLUMN issues.is_blinded IS '관리자에 의해 블라인드 처리됨';
COMMENT ON COLUMN issues.report_count IS '누적 신고 횟수';
COMMENT ON COLUMN polls.is_blinded IS '관리자에 의해 블라인드 처리됨';
COMMENT ON COLUMN polls.report_count IS '누적 신고 횟수';
COMMENT ON COLUMN comments.is_blinded IS '관리자에 의해 블라인드 처리됨';
COMMENT ON COLUMN comments.report_count IS '누적 신고 횟수';

-- 6. Function to increment report count
CREATE OR REPLACE FUNCTION increment_content_report_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment when status is 'pending'
  IF NEW.status = 'pending' THEN
    CASE NEW.content_type
      WHEN 'issue' THEN
        UPDATE issues SET report_count = COALESCE(report_count, 0) + 1 WHERE id = NEW.content_id;
      WHEN 'poll' THEN
        UPDATE polls SET report_count = COALESCE(report_count, 0) + 1 WHERE id = NEW.content_id;
      WHEN 'comment' THEN
        UPDATE comments SET report_count = COALESCE(report_count, 0) + 1 WHERE id = NEW.content_id;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-increment report count on insert
CREATE TRIGGER trigger_increment_report_count
AFTER INSERT ON content_reports
FOR EACH ROW
EXECUTE FUNCTION increment_content_report_count();
