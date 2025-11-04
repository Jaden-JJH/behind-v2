-- Create issue_articles table for follow-up article timeline
CREATE TABLE IF NOT EXISTS issue_articles (
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

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_issue_articles_issue_id ON issue_articles(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_articles_published_at ON issue_articles(issue_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_articles_display_order ON issue_articles(issue_id, display_order ASC);

-- Comments for documentation
COMMENT ON TABLE issue_articles IS '이슈의 후속 기사 타임라인';
COMMENT ON COLUMN issue_articles.article_type IS '뉴스, 유튜브, 트위터, 인스타그램';
COMMENT ON COLUMN issue_articles.is_highlighted IS '최신/중요 기사 강조 표시';
COMMENT ON COLUMN issue_articles.display_order IS '0부터 시작, 낮을수록 위에 표시';

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated at trigger
CREATE TRIGGER update_issue_articles_updated_at
BEFORE UPDATE ON issue_articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
