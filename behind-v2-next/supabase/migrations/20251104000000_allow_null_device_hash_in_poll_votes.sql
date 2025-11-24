-- Allow NULL for device_hash in poll_votes table
-- This enables authenticated users to vote using user_id without device_hash
-- Anonymous users will continue using device_hash

-- Drop the NOT NULL constraint on device_hash
ALTER TABLE poll_votes
ALTER COLUMN device_hash DROP NOT NULL;

-- Add a CHECK constraint to ensure either user_id or device_hash is present
ALTER TABLE poll_votes
ADD CONSTRAINT poll_votes_identification_check
CHECK (
  (user_id IS NOT NULL AND device_hash IS NULL) OR
  (user_id IS NULL AND device_hash IS NOT NULL)
);

-- Add comment for clarity
COMMENT ON COLUMN poll_votes.device_hash IS 'Device hash for anonymous users. NULL for authenticated users who use user_id instead.';
COMMENT ON CONSTRAINT poll_votes_identification_check ON poll_votes IS 'Ensures exactly one identification method: either user_id (authenticated) or device_hash (anonymous), but not both.';
