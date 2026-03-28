ALTER TABLE t_p62094557_heroes_browser_game.heroes
  ADD COLUMN IF NOT EXISTS battles_regen_queue jsonb NOT NULL DEFAULT '[]'::jsonb;