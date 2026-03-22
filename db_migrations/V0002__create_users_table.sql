CREATE TABLE t_p62094557_heroes_browser_game.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON t_p62094557_heroes_browser_game.users(username);

ALTER TABLE t_p62094557_heroes_browser_game.heroes
    ADD COLUMN username VARCHAR(32) REFERENCES t_p62094557_heroes_browser_game.users(username) ON UPDATE CASCADE;
