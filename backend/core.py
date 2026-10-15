import os
import uuid
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

import bcrypt
import jwt
from fastapi import Request, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient

TZ = ZoneInfo("America/Sao_Paulo")
JWT_ALGORITHM = "HS256"

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

NO_ID = {"_id": 0}


def new_id() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_local() -> datetime:
    return datetime.now(TZ)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, role: str) -> str:
    payload = {"sub": user_id, "role": role, "type": "access", "exp": now_utc() + timedelta(hours=12)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def public_user(user: dict) -> dict:
    return {k: user.get(k) for k in ("id", "name", "email", "whatsapp", "role", "professional_id")}


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        raise HTTPException(401, "Não autenticado")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    if payload.get("type") != "access":
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, NO_ID)
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    return user


def require_roles(*roles):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(403, "Acesso restrito")
        return user
    return dep


def scope_filter(user: dict) -> dict:
    if user["role"] == "admin":
        return {}
    return {"professional_id": user.get("professional_id") or "__none__"}
