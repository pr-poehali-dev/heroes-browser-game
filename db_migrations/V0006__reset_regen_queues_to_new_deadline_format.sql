UPDATE t_p62094557_heroes_browser_game.heroes
SET battles_regen_queue = '[]'::jsonb, battles = 6
WHERE jsonb_array_length(battles_regen_queue) > 0;