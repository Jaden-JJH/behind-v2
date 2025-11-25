-- Create issue_follows table for users to follow issues
CREATE TABLE IF NOT EXISTS issue_follows (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, issue_id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_issue_follows_user_id ON issue_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_follows_issue_id ON issue_follows(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_follows_created_at ON issue_follows(user_id, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE issue_follows IS '사용자가 팔로우한 이슈';
COMMENT ON COLUMN issue_follows.user_id IS '팔로우한 사용자';
COMMENT ON COLUMN issue_follows.issue_id IS '팔로우된 이슈';
COMMENT ON COLUMN issue_follows.created_at IS '팔로우한 시간';

-- RLS (Row Level Security) Policies
ALTER TABLE issue_follows ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own follows
CREATE POLICY "Users can view their own follows"
  ON issue_follows FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own follows
CREATE POLICY "Users can insert their own follows"
  ON issue_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own follows
CREATE POLICY "Users can delete their own follows"
  ON issue_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 4: Users cannot update (follow is immutable)
CREATE POLICY "No one can update follows"
  ON issue_follows FOR UPDATE
  USING (FALSE);
