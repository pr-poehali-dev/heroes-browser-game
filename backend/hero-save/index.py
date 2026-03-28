"""
hero-save — Сохранение/загрузка героя + API для Ордена и Орков

GET  (X-User-Id)        — загрузка данных героя
POST (X-User-Id, hero)  — сохранение прогресса героя
POST avatar_image       — загрузка аватарки в S3

Орден (action в querystring или body):
  GET  action=my_order        — мой орден + члены
  GET  action=list_orders     — список всех орденов
  GET  action=active_raid     — активное нападение орков
  POST action=create_order    — создать орден {name, description}
  POST action=join_order      — вступить в орден {order_id}
  POST action=leave_order     — покинуть орден
  POST action=toggle_open     — открыть/закрыть орден (только лидер)
  POST action=attack_orcs     — атаковать орков (1 бой героя)

Схема: t_p62094557_heroes_browser_game
"""
import json
import os
import base64
import random
import boto3
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
    return str(val).replace("'", "''")


def ts_lit(val):
    if val is None:
        return "NULL"
    return f"'{esc(val)}'"


def ok(data):
    return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS_HEADERS, "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    """Загрузка/сохранение героя + API ордена и орков."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    user_id = headers.get("X-User-Id") or headers.get("x-user-id", "")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    body = {}
    if method == "POST" and event.get("body"):
        body = json.loads(event.get("body") or "{}")
        if not action:
            action = body.get("action", "")

    # ─── Орден: только читающие действия не требуют user_id ───
    if action in ("list_orders", "active_raid", "my_order", "create_order",
                  "join_order", "leave_order", "toggle_open", "attack_orcs"):
        return handle_order(action, user_id, body)

    # ─── Стандартное сохранение/загрузка ───
    if not user_id:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "X-User-Id header required"})}

    conn = get_conn()

    if method == "GET":
        sql = f"""
            SELECT name, level, xp, xp_next, hp, max_hp, gold, silver, gems, glory,
                   stat_strength, stat_defense, stat_agility, stat_mastery, stat_vitality,
                   battles, battles_last_regen_at, battles_regen_queue, campaign_end_at, campaign_reward,
                   location, quest_progress, quest_claimed, total_silver_earned,
                   duel_wins, duel_losses, campaign_count, campaign_minutes_total,
                   campaign_minutes, campaign_used_minutes_today, campaign_day,
                   avatar, pets, mine_end_at, mine_depth, diary
            FROM {SCHEMA}.heroes
            WHERE user_id = '{esc(user_id)}'
        """
        rows = conn.run(sql)
        conn.close()

        if not rows:
            return {"statusCode": 404, "headers": CORS_HEADERS, "body": json.dumps({"found": False})}

        keys = [
            "name", "level", "xp", "xp_next", "hp", "max_hp", "gold", "silver", "gems", "glory",
            "stat_strength", "stat_defense", "stat_agility", "stat_mastery", "stat_vitality",
            "battles", "battles_last_regen_at", "battles_regen_queue", "campaign_end_at", "campaign_reward",
            "location", "quest_progress", "quest_claimed", "total_silver_earned",
            "duel_wins", "duel_losses", "campaign_count", "campaign_minutes_total",
            "campaign_minutes", "campaign_used_minutes_today", "campaign_day",
            "avatar", "pets", "mine_end_at", "mine_depth", "diary",
        ]
        data = dict(zip(keys, rows[0]))
        for ts_field in ("battles_last_regen_at", "campaign_end_at", "mine_end_at"):
            if data.get(ts_field) is not None:
                data[ts_field] = data[ts_field].isoformat()

        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"found": True, "hero": data})}

    if method == "POST":
        # Загрузка картинки аватарки в S3
        if "avatar_image" in body:
            img = body["avatar_image"]
            img_data = base64.b64decode(img["data"])
            mime = img.get("mime", "image/jpeg")
            ext = mime.split("/")[-1].replace("jpeg", "jpg")
            key = f"avatars/{esc(user_id)}.{ext}"
            s3 = boto3.client(
                "s3",
                endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
            )
            s3.put_object(Bucket="files", Key=key, Body=img_data, ContentType=mime)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            conn.close()
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"saved": True, "avatar_image_url": cdn_url})}

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
        stat_strength = int(h.get("stat_strength", 5))
        stat_defense = int(h.get("stat_defense", 5))
        stat_agility = int(h.get("stat_agility", 5))
        stat_mastery = int(h.get("stat_mastery", 5))
        stat_vitality = int(h.get("stat_vitality", 5))
        battles = int(h.get("battles", 6))
        blr = ts_lit(h.get("battles_last_regen_at"))
        regen_queue_raw = h.get("battles_regen_queue", [])
        if not isinstance(regen_queue_raw, list):
            regen_queue_raw = []
        battles_regen_queue = esc(json.dumps(regen_queue_raw))
        cea = ts_lit(h.get("campaign_end_at"))
        campaign_reward = int(h.get("campaign_reward", 0))
        location = esc(h.get("location", "Поселок"))
        quest_progress = esc(json.dumps(h.get("quest_progress", {})))
        quest_claimed = esc(json.dumps(h.get("quest_claimed", {})))
        total_silver_earned = int(h.get("total_silver_earned", 0))
        duel_wins = int(h.get("duel_wins", 0))
        duel_losses = int(h.get("duel_losses", 0))
        campaign_count = int(h.get("campaign_count", 0))
        campaign_minutes_total = int(h.get("campaign_minutes_total", 0))
        campaign_minutes = int(h.get("campaign_minutes", 0))
        campaign_used_minutes_today = int(h.get("campaign_used_minutes_today", 0))
        campaign_day = esc(h.get("campaign_day", ""))
        avatar = esc(h.get("avatar", "m1"))
        pets = esc(json.dumps(h.get("pets", [])))
        mine_ea = ts_lit(h.get("mine_end_at"))
        mine_depth = int(h.get("mine_depth", 0))
        diary_raw = h.get("diary", [])
        if not isinstance(diary_raw, list):
            diary_raw = []
        diary = esc(json.dumps(diary_raw[:20]))
        uid = esc(user_id)

        sql = f"""
            INSERT INTO {SCHEMA}.heroes (
                user_id, name, level, xp, xp_next, hp, max_hp, gold, silver, gems, glory,
                stat_strength, stat_defense, stat_agility, stat_mastery, stat_vitality,
                battles, battles_last_regen_at, battles_regen_queue, campaign_end_at, campaign_reward,
                location, quest_progress, quest_claimed, total_silver_earned,
                duel_wins, duel_losses, campaign_count, campaign_minutes_total,
                campaign_minutes, campaign_used_minutes_today, campaign_day,
                avatar, pets, mine_end_at, mine_depth, diary, updated_at
            ) VALUES (
                '{uid}', '{name}', {level}, {xp}, {xp_next}, {hp}, {max_hp},
                {gold}, {silver}, {gems}, {glory},
                {stat_strength}, {stat_defense}, {stat_agility}, {stat_mastery}, {stat_vitality},
                {battles}, {blr}, '{battles_regen_queue}'::jsonb, {cea}, {campaign_reward},
                '{location}', '{quest_progress}'::jsonb, '{quest_claimed}'::jsonb,
                {total_silver_earned},
                {duel_wins}, {duel_losses}, {campaign_count}, {campaign_minutes_total},
                {campaign_minutes}, {campaign_used_minutes_today}, '{campaign_day}',
                '{avatar}', '{pets}'::jsonb, {mine_ea}, {mine_depth}, '{diary}'::jsonb, NOW()
            )
            ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name, level = EXCLUDED.level, xp = EXCLUDED.xp,
                xp_next = EXCLUDED.xp_next, hp = EXCLUDED.hp, max_hp = EXCLUDED.max_hp,
                gold = EXCLUDED.gold, silver = EXCLUDED.silver, gems = EXCLUDED.gems,
                glory = EXCLUDED.glory,
                stat_strength = EXCLUDED.stat_strength, stat_defense = EXCLUDED.stat_defense,
                stat_agility = EXCLUDED.stat_agility, stat_mastery = EXCLUDED.stat_mastery,
                stat_vitality = EXCLUDED.stat_vitality,
                battles = EXCLUDED.battles, battles_last_regen_at = EXCLUDED.battles_last_regen_at,
                battles_regen_queue = EXCLUDED.battles_regen_queue,
                campaign_end_at = EXCLUDED.campaign_end_at, campaign_reward = EXCLUDED.campaign_reward,
                location = EXCLUDED.location, quest_progress = EXCLUDED.quest_progress,
                quest_claimed = EXCLUDED.quest_claimed,
                total_silver_earned = EXCLUDED.total_silver_earned,
                duel_wins = EXCLUDED.duel_wins, duel_losses = EXCLUDED.duel_losses,
                campaign_count = EXCLUDED.campaign_count,
                campaign_minutes_total = EXCLUDED.campaign_minutes_total,
                campaign_minutes = EXCLUDED.campaign_minutes,
                campaign_used_minutes_today = EXCLUDED.campaign_used_minutes_today,
                campaign_day = EXCLUDED.campaign_day,
                avatar = EXCLUDED.avatar, pets = EXCLUDED.pets,
                mine_end_at = EXCLUDED.mine_end_at, mine_depth = EXCLUDED.mine_depth,
                diary = EXCLUDED.diary,
                updated_at = NOW()
        """
        conn.run(sql)
        conn.close()
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"saved": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}


# ─────────────────────────────────────────────────────────────
# Логика Ордена и Орков
# ─────────────────────────────────────────────────────────────

def handle_order(action: str, user_id: str, body: dict) -> dict:
    conn = get_conn()
    try:
        # helper: получить имя пользователя
        def get_username(uid):
            rows = conn.run(f"SELECT username FROM {SCHEMA}.heroes WHERE user_id = '{esc(uid)}' LIMIT 1")
            return rows[0][0] if rows else uid

        # helper: мой орден
        def get_my_order_row(uid):
            rows = conn.run(f"""
                SELECT o.id, o.name, o.description, o.leader_user_id, o.is_open
                FROM {SCHEMA}.orders o
                JOIN {SCHEMA}.order_members m ON m.order_id = o.id
                WHERE m.user_id = '{esc(uid)}'
            """)
            return rows[0] if rows else None

        # ── GET: мой орден ──
        if action == "my_order":
            if not user_id:
                return err("no user_id")
            row = get_my_order_row(user_id)
            if not row:
                return ok({"order": None, "members": []})
            order_id = row[0]
            cnt_rows = conn.run(f"SELECT COUNT(*) FROM {SCHEMA}.order_members WHERE order_id = {order_id}")
            order = {"id": row[0], "name": row[1], "description": row[2],
                     "leader_user_id": row[3], "is_open": row[4],
                     "member_count": cnt_rows[0][0]}
            members_rows = conn.run(f"""
                SELECT m.user_id, m.username,
                       h.level, h.hp, h.max_hp, h.attack, h.defense, h.magic, h.speed,
                       h.stat_strength, h.stat_defense, h.stat_agility, h.stat_mastery, h.stat_vitality
                FROM {SCHEMA}.order_members m
                LEFT JOIN {SCHEMA}.heroes h ON h.user_id = m.user_id
                WHERE m.order_id = {order_id}
                ORDER BY m.joined_at
            """)
            members = []
            for r in members_rows:
                members.append({
                    "user_id": r[0], "username": r[1],
                    "level": r[2], "hp": r[3], "max_hp": r[4],
                    "attack": r[5], "defense": r[6], "magic": r[7], "speed": r[8],
                    "stat_strength": r[9], "stat_defense_val": r[10], "stat_agility": r[11],
                    "stat_mastery": r[12], "stat_vitality": r[13],
                })
            return ok({"order": order, "members": members})

        # ── GET: список орденов ──
        if action == "list_orders":
            rows = conn.run(f"""
                SELECT o.id, o.name, o.description, o.leader_user_id, o.is_open,
                       (SELECT COUNT(*) FROM {SCHEMA}.order_members WHERE order_id = o.id) as member_count,
                       h.username as leader_name
                FROM {SCHEMA}.orders o
                LEFT JOIN {SCHEMA}.heroes h ON h.user_id = o.leader_user_id
                ORDER BY member_count DESC, o.id
            """)
            orders = [{"id": r[0], "name": r[1], "description": r[2],
                       "leader_user_id": r[3], "is_open": r[4],
                       "member_count": r[5], "leader_name": r[6]} for r in rows]
            return ok({"orders": orders})

        # ── GET: активный рейд ──
        if action == "active_raid":
            rows = conn.run(f"""
                SELECT id, started_at, ends_at, total_orc_hp, current_orc_hp, is_active, result
                FROM {SCHEMA}.orc_raids WHERE is_active = TRUE
                ORDER BY started_at DESC LIMIT 1
            """)
            if not rows:
                return ok({"raid": None})
            r = rows[0]
            raid = {
                "id": r[0],
                "started_at": r[1].isoformat() if r[1] else None,
                "ends_at": r[2].isoformat() if r[2] else None,
                "total_orc_hp": r[3],
                "current_orc_hp": max(0, r[4]),
                "is_active": r[5],
                "result": r[6],
            }
            top_rows = conn.run(f"""
                SELECT username, SUM(damage) as total_dmg
                FROM {SCHEMA}.orc_damage WHERE raid_id = {r[0]}
                GROUP BY username ORDER BY total_dmg DESC LIMIT 10
            """)
            raid["top_damage"] = [{"username": tr[0], "damage": tr[1]} for tr in top_rows]
            return ok({"raid": raid})

        # ── POST: создать орден ──
        if action == "create_order":
            if not user_id:
                return err("no user_id")
            name = (body.get("name") or "").strip()
            description = (body.get("description") or "").strip()
            if not name or len(name) < 3:
                return err("Название ордена минимум 3 символа")
            existing = conn.run(f"SELECT 1 FROM {SCHEMA}.order_members WHERE user_id = '{esc(user_id)}'")
            if existing:
                return err("Вы уже состоите в ордене")
            username = get_username(user_id)
            conn.run(f"""
                INSERT INTO {SCHEMA}.orders (name, description, leader_user_id)
                VALUES ('{esc(name)}', '{esc(description)}', '{esc(user_id)}')
            """)
            oid_rows = conn.run(f"SELECT id FROM {SCHEMA}.orders WHERE name = '{esc(name)}' LIMIT 1")
            if not oid_rows:
                return err("Ошибка создания ордена")
            order_id = oid_rows[0][0]
            conn.run(f"""
                INSERT INTO {SCHEMA}.order_members (order_id, user_id, username)
                VALUES ({order_id}, '{esc(user_id)}', '{esc(username)}')
            """)
            return ok({"created": True, "order_id": order_id})

        # ── POST: вступить в орден ──
        if action == "join_order":
            if not user_id:
                return err("no user_id")
            order_id = body.get("order_id")
            if not order_id:
                return err("no order_id")
            existing = conn.run(f"SELECT 1 FROM {SCHEMA}.order_members WHERE user_id = '{esc(user_id)}'")
            if existing:
                return err("Вы уже состоите в ордене")
            orows = conn.run(f"SELECT is_open FROM {SCHEMA}.orders WHERE id = {int(order_id)}")
            if not orows:
                return err("Орден не найден")
            if not orows[0][0]:
                return err("Орден закрыт для вступления")
            username = get_username(user_id)
            conn.run(f"""
                INSERT INTO {SCHEMA}.order_members (order_id, user_id, username)
                VALUES ({int(order_id)}, '{esc(user_id)}', '{esc(username)}')
            """)
            return ok({"joined": True})

        # ── POST: покинуть орден ──
        if action == "leave_order":
            if not user_id:
                return err("no user_id")
            lrows = conn.run(f"""
                SELECT o.id FROM {SCHEMA}.orders o
                JOIN {SCHEMA}.order_members m ON m.order_id = o.id
                WHERE m.user_id = '{esc(user_id)}' AND o.leader_user_id = '{esc(user_id)}'
            """)
            if lrows:
                return err("Лидер не может покинуть орден")
            conn.run(f"DELETE FROM {SCHEMA}.order_members WHERE user_id = '{esc(user_id)}'")
            return ok({"left": True})

        # ── POST: открыть/закрыть орден ──
        if action == "toggle_open":
            if not user_id:
                return err("no user_id")
            orows = conn.run(f"SELECT id, is_open FROM {SCHEMA}.orders WHERE leader_user_id = '{esc(user_id)}'")
            if not orows:
                return err("Вы не являетесь лидером ордена")
            new_val = "FALSE" if orows[0][1] else "TRUE"
            conn.run(f"UPDATE {SCHEMA}.orders SET is_open = {new_val} WHERE id = {orows[0][0]}")
            return ok({"is_open": not orows[0][1]})

        # ── POST: атаковать орков ──
        if action == "attack_orcs":
            if not user_id:
                return err("no user_id")
            member_rows = conn.run(f"SELECT 1 FROM {SCHEMA}.order_members WHERE user_id = '{esc(user_id)}'")
            if not member_rows:
                return err("Только члены ордена могут сражаться с орками")
            raid_rows = conn.run(f"""
                SELECT id, current_orc_hp FROM {SCHEMA}.orc_raids
                WHERE is_active = TRUE ORDER BY started_at DESC LIMIT 1
            """)
            if not raid_rows:
                return err("Нет активного нападения орков")
            raid_id, current_hp = raid_rows[0]
            if current_hp <= 0:
                return err("Орки уже побеждены")
            hero_rows = conn.run(f"""
                SELECT attack, stat_strength, stat_mastery, username, battles
                FROM {SCHEMA}.heroes WHERE user_id = '{esc(user_id)}'
            """)
            if not hero_rows:
                return err("Герой не найден")
            h_attack, h_strength, h_mastery, username, hero_battles = hero_rows[0]
            if hero_battles <= 0:
                return err("Нет зарядов боёв")
            base_dmg = max(1, h_attack + (h_strength or 0) // 2 + (h_mastery or 0) // 3)
            damage = random.randint(int(base_dmg * 0.8), int(base_dmg * 1.3))
            new_hp = max(0, current_hp - damage)
            conn.run(f"UPDATE {SCHEMA}.orc_raids SET current_orc_hp = {new_hp} WHERE id = {raid_id}")
            conn.run(f"""
                INSERT INTO {SCHEMA}.orc_damage (raid_id, user_id, username, damage)
                VALUES ({raid_id}, '{esc(user_id)}', '{esc(username)}', {damage})
            """)
            # Уменьшаем бои героя
            new_battles = max(0, hero_battles - 1)
            conn.run(f"UPDATE {SCHEMA}.heroes SET battles = {new_battles} WHERE user_id = '{esc(user_id)}'")
            if new_hp <= 0:
                conn.run(f"UPDATE {SCHEMA}.orc_raids SET is_active = FALSE, result = 'victory' WHERE id = {raid_id}")
            return ok({"damage": damage, "orc_hp_left": new_hp, "victory": new_hp <= 0, "battles_left": new_battles})

        return err("unknown action")

    finally:
        conn.close()
