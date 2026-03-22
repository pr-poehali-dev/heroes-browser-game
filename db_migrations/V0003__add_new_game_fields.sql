ALTER TABLE t_p62094557_heroes_browser_game.heroes
  ADD COLUMN IF NOT EXISTS duel_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duel_losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_minutes_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_used_minutes_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS campaign_day character varying(10) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar character varying(8) NOT NULL DEFAULT 'm1',
  ADD COLUMN IF NOT EXISTS pets jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mine_end_at timestamp with time zone NULL,
  ADD COLUMN IF NOT EXISTS mine_depth integer NOT NULL DEFAULT 0;
