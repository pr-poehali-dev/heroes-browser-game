import json
import os
import hashlib
import pg8000.native
from urllib.parse import urlparse, unquote

SCHEMA = "t_p62094557_heroes_browser_game"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
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


def check_auth(headers: dict) -> bool:
    token = headers.get("X-Admin-Token") or headers.get("x-admin-token", "")
    admin_pass = os.environ.get("ADMIN_PASSWORD", "")
    expected = hashlib.sha256(admin_pass.encode()).hexdigest()
    return hashlib.sha256(token.encode()).hexdigest() == expected


def esc(val) -> str:
    return str(val).replace("'", "''")


def handler(event: dict, context) -> dict:
    """Панель администратора: список игроков и редактирование параметров."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    headers = event.get("headers") or {}

    if not check_auth(headers):
        return {
            "statusCode": 401,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Неверный пароль администратора"}),
        }

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "list")

    conn = get_conn()

    if method == "GET" and action == "list":
        rows = conn.run(
            f"""
            SELECT user_id, username, name, level, xp, hp, max_hp,
                   gold, silver, gems, glory, attack, defense, magic, speed,
                   stat_strength, stat_defense, stat_agility, stat_mastery, stat_vitality,
                   battles, total_silver_earned, updated_at
            FROM {SCHEMA}.heroes
            ORDER BY updated_at DESC
            LIMIT 100
            """
        )
        conn.close()

        keys = [
            "user_id", "username", "name", "level", "xp", "hp", "max_hp",
            "gold", "silver", "gems", "glory", "attack", "defense", "magic", "speed",
            "stat_strength", "stat_defense", "stat_agility", "stat_mastery", "stat_vitality",
            "battles", "total_silver_earned", "updated_at",
        ]
        players = []
        for row in rows:
            d = dict(zip(keys, row))
            if d["updated_at"] is not None:
                d["updated_at"] = d["updated_at"].isoformat()
            players.append(d)

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"players": players}),
        }

    if method == "POST" and action == "update":
        body = json.loads(event.get("body") or "{}")
        user_id = body.get("user_id", "")
        if not user_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "user_id required"})}

        allowed = [
            "name", "level", "xp", "xp_next", "hp", "max_hp",
            "gold", "silver", "gems", "glory",
            "attack", "defense", "magic", "speed",
            "stat_strength", "stat_defense", "stat_agility", "stat_mastery", "stat_vitality",
            "battles", "total_silver_earned",
        ]
        int_fields = {
            "level", "xp", "xp_next", "hp", "max_hp", "gold", "silver", "gems", "glory",
            "attack", "defense", "magic", "speed",
            "stat_strength", "stat_defense", "stat_agility", "stat_mastery", "stat_vitality",
            "battles", "total_silver_earned",
        }

        updates = []
        for field in allowed:
            if field not in body:
                continue
            val = body[field]
            if field in int_fields:
                updates.append(f"{field} = {int(val)}")
            else:
                updates.append(f"{field} = '{esc(str(val))}'")

        if not updates:
            conn.close()
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет полей для обновления"})}

        updates.append("updated_at = NOW()")
        set_clause = ", ".join(updates)

        conn.run(f"UPDATE {SCHEMA}.heroes SET {set_clause} WHERE user_id = '{esc(user_id)}'")
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"saved": True}),
        }

    conn.close()
    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неизвестный запрос"})}
