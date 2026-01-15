-- Add carousel display slots to issues table
-- These fields control which issues appear in the carousel on the issues page

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS show_in_carousel_slot1 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_carousel_slot2 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_carousel_slot3 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_carousel_slot4 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_in_carousel_slot5 BOOLEAN DEFAULT false;

-- Add index for faster carousel issue queries
CREATE INDEX IF NOT EXISTS idx_issues_carousel_slots
ON issues (show_in_carousel_slot1, show_in_carousel_slot2, show_in_carousel_slot3, show_in_carousel_slot4, show_in_carousel_slot5)
WHERE show_in_carousel_slot1 = true OR show_in_carousel_slot2 = true OR show_in_carousel_slot3 = true OR show_in_carousel_slot4 = true OR show_in_carousel_slot5 = true;

-- Add comments
COMMENT ON COLUMN issues.show_in_carousel_slot1 IS 'Carousel display slot 1 (first position)';
COMMENT ON COLUMN issues.show_in_carousel_slot2 IS 'Carousel display slot 2 (second position)';
COMMENT ON COLUMN issues.show_in_carousel_slot3 IS 'Carousel display slot 3 (third position)';
COMMENT ON COLUMN issues.show_in_carousel_slot4 IS 'Carousel display slot 4 (fourth position)';
COMMENT ON COLUMN issues.show_in_carousel_slot5 IS 'Carousel display slot 5 (fifth position)';
