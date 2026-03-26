"""
Возвращает список реальных игроков для дуэли.
GET / — все игроки (кроме себя), с базовыми параметрами для дуэли.
Параметры: user_id (из заголовка X-User-Id), limit (default 20)
"""
import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    user_id = event.get("headers", {}).get("x-user-id", "") or event.get("headers", {}).get("X-User-Id", "")
    params = event.get("queryStringParameters") or {}
    limit = min(int(params.get("limit", 20)), 50)

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    schema = "t_p62094557_heroes_browser_game"

    cur.execute(f"""
        SELECT
            h.user_id,
            h.name,
            h.level,
            h.avatar,
            h.stat_strength,
            h.stat_defense,
            h.stat_agility,
            h.stat_mastery,
            h.stat_vitality,
            h.attack,
            h.defense,
            h.magic,
            h.speed,
            h.hp,
            h.max_hp,
            h.duel_wins,
            h.duel_losses,
            h.glory,
            h.xp,
            h.silver
        FROM {schema}.heroes h
        WHERE h.user_id != %s
        ORDER BY h.updated_at DESC
        LIMIT %s
    """, (user_id, limit))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    cols = [
        "user_id", "name", "level", "avatar",
        "stat_strength", "stat_defense", "stat_agility", "stat_mastery", "stat_vitality",
        "attack", "defense", "magic", "speed", "hp", "max_hp",
        "duel_wins", "duel_losses", "glory", "xp", "silver"
    ]
    players = [dict(zip(cols, row)) for row in rows]

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"players": players, "count": len(players)}),
    }
