import json
import os
import pg8000.native
from urllib.parse import urlparse, unquote

SCHEMA = "t_p62094557_heroes_browser_game"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    dsn = os.environ["DATABASE_URL"]
    p = urlparse(dsn)
    return pg8000.native.Connection(
        user=unquote(p.username),
        password=unquote(p.password),
        host=p.hostname,
        port=p.port or 5432,
        database=p.path.lstrip("/"),
    )


def esc(val):
    """Escape string value for safe SQL embedding."""
    return str(val).replace("'", "''")


def ts_lit(val):
    """Return SQL timestamp literal or NULL."""
    if val is None:
        return "NULL"
    return f"'{esc(val)}'"


def handler(event: dict, context) -> dict:
    """Загрузка (GET) и сохранение (POST) прогресса героя по user_id."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    user_id = headers.get("X-User-Id") or headers.get("x-user-id", "")

    if not user_id:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "X-User-Id header required"}),
        }

    conn = get_conn()

    if method == "GET":
        sql = f"""
            SELECT name, level, xp, xp_next, hp, max_hp, gold, silver, gems, glory,
                   attack, defense, magic, speed,
                   stat_strength, stat_defense, stat_agility, stat_mastery, stat_vitality,
                   battles, battles_last_regen_at, campaign_end_at, campaign_reward,
                   location, quest_progress, quest_claimed, total_silver_earned
            FROM {SCHEMA}.heroes
            WHERE user_id = '{esc(user_id)}'
        """
        rows = conn.run(sql)
        conn.close()

        if not rows:
            return {
                "statusCode": 404,
                "headers": CORS_HEADERS,
                "body": json.dumps({"found": False}),
            }

        keys = [
            "name", "level", "xp", "xp_next", "hp", "max_hp", "gold", "silver", "gems", "glory",
            "attack", "defense", "magic", "speed",
            "stat_strength", "stat_defense", "stat_agility", "stat_mastery", "stat_vitality",
            "battles", "battles_last_regen_at", "campaign_end_at", "campaign_reward",
            "location", "quest_progress", "quest_claimed", "total_silver_earned",
        ]
        data = dict(zip(keys, rows[0]))

        for ts_field in ("battles_last_regen_at", "campaign_end_at"):
            if data[ts_field] is not None:
                data[ts_field] = data[ts_field].isoformat()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"found": True, "hero": data}),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        h = body.get("hero", {})

        name = esc(h.get("name", "Странник"))
        level = int(h.get("level", 1))
        xp = int(h.get("xp", 0))
        xp_next = int(h.get("xp_next", 300))
        hp = int(h.get("hp", 100))
        max_hp = int(h.get("max_hp", 100))
        gold = int(h.get("gold", 250))
        silver = int(h.get("silver", 480))
        gems = int(h.get("gems", 5))
        glory = int(h.get("glory", 0))
        attack = int(h.get("attack", 12))
        defense = int(h.get("defense", 8))
        magic = int(h.get("magic", 6))
        speed = int(h.get("speed", 10))
        stat_strength = int(h.get("stat_strength", 5))
        stat_defense = int(h.get("stat_defense", 5))
        stat_agility = int(h.get("stat_agility", 5))
        stat_mastery = int(h.get("stat_mastery", 5))
        stat_vitality = int(h.get("stat_vitality", 5))
        battles = int(h.get("battles", 6))
        blr = ts_lit(h.get("battles_last_regen_at"))
        cea = ts_lit(h.get("campaign_end_at"))
        campaign_reward = int(h.get("campaign_reward", 0))
        location = esc(h.get("location", "Поселок"))
        quest_progress = esc(json.dumps(h.get("quest_progress", {})))
        quest_claimed = esc(json.dumps(h.get("quest_claimed", {})))
        total_silver_earned = int(h.get("total_silver_earned", 0))
        uid = esc(user_id)

        sql = f"""
            INSERT INTO {SCHEMA}.heroes (
                user_id, name, level, xp, xp_next, hp, max_hp, gold, silver, gems, glory,
                attack, defense, magic, speed,
                stat_strength, stat_defense, stat_agility, stat_mastery, stat_vitality,
                battles, battles_last_regen_at, campaign_end_at, campaign_reward,
                location, quest_progress, quest_claimed, total_silver_earned, updated_at
            ) VALUES (
                '{uid}', '{name}', {level}, {xp}, {xp_next}, {hp}, {max_hp},
                {gold}, {silver}, {gems}, {glory},
                {attack}, {defense}, {magic}, {speed},
                {stat_strength}, {stat_defense}, {stat_agility}, {stat_mastery}, {stat_vitality},
                {battles}, {blr}, {cea}, {campaign_reward},
                '{location}', '{quest_progress}'::jsonb, '{quest_claimed}'::jsonb,
                {total_silver_earned}, NOW()
            )
            ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name,
                level = EXCLUDED.level,
                xp = EXCLUDED.xp,
                xp_next = EXCLUDED.xp_next,
                hp = EXCLUDED.hp,
                max_hp = EXCLUDED.max_hp,
                gold = EXCLUDED.gold,
                silver = EXCLUDED.silver,
                gems = EXCLUDED.gems,
                glory = EXCLUDED.glory,
                attack = EXCLUDED.attack,
                defense = EXCLUDED.defense,
                magic = EXCLUDED.magic,
                speed = EXCLUDED.speed,
                stat_strength = EXCLUDED.stat_strength,
                stat_defense = EXCLUDED.stat_defense,
                stat_agility = EXCLUDED.stat_agility,
                stat_mastery = EXCLUDED.stat_mastery,
                stat_vitality = EXCLUDED.stat_vitality,
                battles = EXCLUDED.battles,
                battles_last_regen_at = EXCLUDED.battles_last_regen_at,
                campaign_end_at = EXCLUDED.campaign_end_at,
                campaign_reward = EXCLUDED.campaign_reward,
                location = EXCLUDED.location,
                quest_progress = EXCLUDED.quest_progress,
                quest_claimed = EXCLUDED.quest_claimed,
                total_silver_earned = EXCLUDED.total_silver_earned,
                updated_at = NOW()
        """
        conn.run(sql)
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"saved": True}),
        }

    return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}
