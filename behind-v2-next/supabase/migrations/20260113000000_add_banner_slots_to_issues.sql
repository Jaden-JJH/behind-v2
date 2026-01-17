-- Add banner display slots to issues table
-- These fields control which issues appear in the rolling banner on the main page

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS show_in_banner_slot1 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_banner_slot2 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_banner_slot3 BOOLEAN DEFAULT false;

-- Add index for faster banner issue queries
CREATE INDEX IF NOT EXISTS idx_issues_banner_slots
ON issues (show_in_banner_slot1, show_in_banner_slot2, show_in_banner_slot3)
WHERE show_in_banner_slot1 = true OR show_in_banner_slot2 = true OR show_in_banner_slot3 = true;

-- Add comment
COMMENT ON COLUMN issues.show_in_banner_slot1 IS 'Banner display slot 1 (first position)';
COMMENT ON COLUMN issues.show_in_banner_slot2 IS 'Banner display slot 2 (second position)';
COMMENT ON COLUMN issues.show_in_banner_slot3 IS 'Banner display slot 3 (third position)';
