-- Fix vote_poll_authenticated function - resolve ambiguous vote_count column reference
-- The issue is that RETURN TABLE has vote_count, and we're selecting po.vote_count
-- PostgreSQL can't determine which one is being referenced

CREATE OR REPLACE FUNCTION public.vote_poll_authenticated(p_poll_id uuid, p_option_id uuid, p_user_id uuid)
RETURNS TABLE(option_id uuid, label text, vote_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 1. 중복 투표 체크 (user_id 기반)
  IF EXISTS (
    SELECT 1 FROM poll_votes
    WHERE poll_votes.poll_id = p_poll_id
    AND poll_votes.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_VOTE';
  END IF;

  -- 2. 옵션 유효성 체크
  IF NOT EXISTS (
    SELECT 1 FROM poll_options
    WHERE poll_options.id = p_option_id
    AND poll_options.poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'INVALID_OPTION';
  END IF;

  -- 3. 투표 기록 (user_id만 저장, device_hash는 NULL)
  INSERT INTO poll_votes (poll_id, user_id, device_hash, created_at)
  VALUES (p_poll_id, p_user_id, NULL, NOW());

  -- 4. 투표수 증가
  UPDATE poll_options
  SET vote_count = poll_options.vote_count + 1
  WHERE poll_options.id = p_option_id;

  -- 5. 결과 반환 (vote_poll 함수와 동일한 패턴 사용)
  RETURN QUERY
    SELECT
      poll_options.id AS option_id,
      poll_options.label,
      poll_options.vote_count
    FROM poll_options
    WHERE poll_options.poll_id = p_poll_id
    ORDER BY poll_options.label;
END;
$function$;
