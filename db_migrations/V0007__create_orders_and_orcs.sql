
CREATE TABLE t_p62094557_heroes_browser_game.orders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  leader_user_id VARCHAR(64) NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p62094557_heroes_browser_game.order_members (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES t_p62094557_heroes_browser_game.orders(id),
  user_id VARCHAR(64) NOT NULL,
  username VARCHAR(32) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE t_p62094557_heroes_browser_game.orc_raids (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  total_orc_hp INTEGER NOT NULL DEFAULT 0,
  current_orc_hp INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  result VARCHAR(16) NOT NULL DEFAULT 'pending'
);

CREATE TABLE t_p62094557_heroes_browser_game.orc_damage (
  id SERIAL PRIMARY KEY,
  raid_id INTEGER NOT NULL REFERENCES t_p62094557_heroes_browser_game.orc_raids(id),
  user_id VARCHAR(64) NOT NULL,
  username VARCHAR(32) NOT NULL,
  damage INTEGER NOT NULL DEFAULT 0,
  dealt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
