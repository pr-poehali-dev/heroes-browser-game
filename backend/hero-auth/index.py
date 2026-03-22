import json
import os
import hashlib
import secrets
import pg8000.native
from urllib.parse import urlparse, unquote

SCHEMA = "t_p62094557_heroes_browser_game"

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def esc(val: str) -> str:
    return str(val).replace("'", "''")


def handler(event: dict, context) -> dict:
    """Регистрация (action=register) и вход (action=login) по нику и паролю."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    avatar = esc(body.get("avatar", "m1"))

    if not username or not password:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Заполни ник и пароль"}),
        }

    if len(username) < 3 or len(username) > 32:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Ник должен быть от 3 до 32 символов"}),
        }

    conn = get_conn()

    if action == "register":
        rows = conn.run(f"SELECT id FROM {SCHEMA}.users WHERE username = '{esc(username)}'")
        if rows:
            conn.close()
            return {
                "statusCode": 409,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Этот ник уже занят"}),
            }

        salt = secrets.token_hex(16)
        pw_hash = salt + ":" + hash_password(password, salt)
        user_id = "u_" + secrets.token_hex(16)

        conn.run(
            f"INSERT INTO {SCHEMA}.users (username, password_hash) VALUES ('{esc(username)}', '{esc(pw_hash)}')"
        )
        # Create hero record for new user
        conn.run(
            f"""
            INSERT INTO {SCHEMA}.heroes (user_id, username, name, avatar, updated_at)
            VALUES ('{esc(user_id)}', '{esc(username)}', '{esc(username)}', '{avatar}', NOW())
            ON CONFLICT (user_id) DO NOTHING
            """
        )
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"success": True, "user_id": user_id, "username": username, "avatar": avatar}),
        }

    if action == "login":
        rows = conn.run(
            f"SELECT password_hash, id FROM {SCHEMA}.users WHERE username = '{esc(username)}'"
        )
        if not rows:
            conn.close()
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Неверный ник или пароль"}),
            }

        stored_hash = rows[0][0]
        salt, expected = stored_hash.split(":", 1)
        if hash_password(password, salt) != expected:
            conn.close()
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Неверный ник или пароль"}),
            }

        # Get or create user_id from heroes table
        hero_rows = conn.run(
            f"SELECT user_id, avatar FROM {SCHEMA}.heroes WHERE username = '{esc(username)}'"
        )
        if hero_rows:
            user_id = hero_rows[0][0]
            hero_avatar = hero_rows[0][1] or "m1"
        else:
            user_id = "u_" + secrets.token_hex(16)
            hero_avatar = "m1"
            conn.run(
                f"""
                INSERT INTO {SCHEMA}.heroes (user_id, username, name, updated_at)
                VALUES ('{esc(user_id)}', '{esc(username)}', '{esc(username)}', NOW())
                ON CONFLICT (user_id) DO NOTHING
                """
            )

        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"success": True, "user_id": user_id, "username": username, "avatar": hero_avatar}),
        }

    conn.close()
    return {
        "statusCode": 400,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": "Неизвестное действие"}),
    }