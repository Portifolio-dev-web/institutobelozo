from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import os  # noqa: E402
import hmac  # noqa: E402
import logging  # noqa: E402
from datetime import datetime, date, time, timedelta  # noqa: E402
from typing import List, Optional, Literal  # noqa: E402

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks  # noqa: E402
from pydantic import BaseModel, Field, EmailStr  # noqa: E402
from pymongo.errors import DuplicateKeyError  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

from core import (db, client, NO_ID, TZ, new_id, now_utc, now_local, hash_password, verify_password,  # noqa: E402
                  create_access_token, public_user, get_current_user, require_roles, scope_filter)
from notifications import notify, notify_client  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("belozo")

app = FastAPI(title="Instituto Belozo API")
api = APIRouter(prefix="/api")

staff = require_roles("admin", "professional")
admin_only = require_roles("admin")
client_only = require_roles("client")

SLA_MINUTES = 60
RECURRENCE_WEEKS = 8
DEFAULT_SCHEDULE = {str(d): [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}] for d in range(5)}
WEEKDAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]


# ---------- Models ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2)
    whatsapp: str = Field(min_length=10)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AppointmentIn(BaseModel):
    service_id: str
    professional_id: str = "any"
    date: str
    time: str


class RescheduleIn(BaseModel):
    date: str
    time: str
    mode: Literal["single", "weekly"] = "single"


class CancelIn(BaseModel):
    scope: Literal["single", "future"] = "single"


class TimeBlock(BaseModel):
    start: str
    end: str


class ScheduleIn(BaseModel):
    schedule: dict[str, List[TimeBlock]]
    session_minutes: int = Field(ge=15, le=240)


class ProfessionalIn(BaseModel):
    name: str
    whatsapp: str
    specialty: str
    bio: str = ""
    service_ids: List[str] = []
    session_minutes: int = 60
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class ServiceIn(BaseModel):
    name: str
    category: Literal["personal", "fisio"]
    description: str = ""


class Exercise(BaseModel):
    name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    load: Optional[float] = None


class RecordIn(BaseModel):
    date: str
    notes: str = ""
    weight: Optional[float] = None
    pain: Optional[int] = Field(default=None, ge=0, le=10)
    mobility: str = ""
    exercises: List[Exercise] = []
    recovery_notes: str = ""
    appointment_id: Optional[str] = None


# ---------- Helpers ----------
def clean(data):
    if isinstance(data, list):
        return [clean(d) for d in data]
    if isinstance(data, dict):
        return {k: v for k, v in data.items() if k != "_id"}
    return data


def parse_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(400, "Data inválida")


def fmt_br(d: str) -> str:
    y, m, dd = d.split("-")
    return f"{dd}/{m}/{y}"


def fmt_hour(t: str) -> str:
    h, m = t.split(":")
    return f"{h}h" if m == "00" else f"{h}h{m}"


def first_name(name: str) -> str:
    return (name or "").split(" ")[0]


def day_slots(prof: dict, d: date) -> List[str]:
    blocks = (prof.get("schedule") or {}).get(str(d.weekday()), [])
    dur = timedelta(minutes=prof.get("session_minutes", 60))
    out = []
    for b in blocks:
        t = datetime.combine(d, time.fromisoformat(b["start"]))
        end = datetime.combine(d, time.fromisoformat(b["end"]))
        while t + dur <= end:
            out.append(t.strftime("%H:%M"))
            t += dur
    return sorted(set(out))


def is_future(d: date, t: str) -> bool:
    return datetime.combine(d, time.fromisoformat(t), tzinfo=TZ) > now_local()


async def booked_map(prof_ids: List[str], start: str, end: str) -> dict:
    cur = db.appointments.find({"professional_id": {"$in": prof_ids}, "active": True,
                                "date": {"$gte": start, "$lte": end}}, {"_id": 0, "professional_id": 1, "date": 1, "time": 1})
    out = {}
    async for a in cur:
        out.setdefault((a["professional_id"], a["date"]), set()).add(a["time"])
    return out


async def get_scoped_appt(appt_id: str, user: dict) -> dict:
    a = await db.appointments.find_one({"id": appt_id, **scope_filter(user)}, NO_ID)
    if not a:
        raise HTTPException(404, "Agendamento não encontrado")
    return a


def appt_doc(user: dict, service: dict, prof: dict, d: str, t: str, status: str, recurrence_id=None) -> dict:
    now = now_utc().isoformat()
    return {"id": new_id(), "client_id": user["id"], "client_name": user["name"],
            "client_whatsapp": user.get("whatsapp", ""), "client_email": user.get("email", ""),
            "professional_id": prof["id"], "professional_name": prof["name"],
            "service_id": service["id"], "service_name": service["name"], "service_category": service["category"],
            "date": d, "time": t, "status": status, "active": True, "recurrence_id": recurrence_id,
            "created_at": now, "responded_at": now if status == "confirmed" else None}


async def generate_recurrence(rec: dict) -> dict:
    created, skipped = [], []
    horizon = now_local().date() + timedelta(weeks=RECURRENCE_WEEKS)
    d = date.fromisoformat(rec["generated_until"]) + timedelta(weeks=1)
    client_user = {"id": rec["client_id"], "name": rec["client_name"], "whatsapp": rec.get("client_whatsapp", ""),
                   "email": rec.get("client_email", "")}
    service = {"id": rec["service_id"], "name": rec["service_name"], "category": rec["service_category"]}
    prof = {"id": rec["professional_id"], "name": rec["professional_name"]}
    last = rec["generated_until"]
    while d <= horizon:
        ds = d.isoformat()
        try:
            await db.appointments.insert_one(appt_doc(client_user, service, prof, ds, rec["time"], "confirmed", rec["id"]))
            created.append(ds)
        except DuplicateKeyError:
            skipped.append(ds)
        last = ds
        d += timedelta(weeks=1)
    await db.recurrences.update_one({"id": rec["id"]}, {"$set": {"generated_until": last},
                                                        "$push": {"skipped": {"$each": skipped}}})
    return {"created": created, "skipped": skipped}


async def end_recurrence_from(rec_id: str, from_date: str, exclude_id: str | None = None):
    q = {"recurrence_id": rec_id, "active": True, "date": {"$gte": from_date}}
    if exclude_id:
        q["id"] = {"$ne": exclude_id}
    await db.appointments.update_many(q, {"$set": {"status": "cancelled", "active": False,
                                                   "responded_at": now_utc().isoformat()}})
    await db.recurrences.update_one({"id": rec_id}, {"$set": {"active": False}})


# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Este email já está cadastrado")
    user = {"id": new_id(), "name": body.name.strip(), "email": email, "whatsapp": body.whatsapp.strip(),
            "role": "client", "professional_id": None, "password_hash": hash_password(body.password),
            "created_at": now_utc().isoformat()}
    await db.users.insert_one(user)
    token = create_access_token(user["id"], "client")
    return {"token": token, "user": public_user(user)}


@api.post("/auth/login")
async def login(body: LoginIn, request: Request):
    email = body.email.lower()
    ident = f"{request.client.host if request.client else 'x'}:{email}"
    att = await db.login_attempts.find_one({"identifier": ident})
    if att and att.get("count", 0) >= 5 and att.get("locked_until", "") > now_utc().isoformat():
        raise HTTPException(429, "Muitas tentativas. Tente novamente em 15 minutos.")
    user = await db.users.find_one({"email": email}, NO_ID)
    if not user or not verify_password(body.password, user["password_hash"]):
        count = (att or {}).get("count", 0) + 1
        await db.login_attempts.update_one({"identifier": ident}, {"$set": {
            "count": count, "locked_until": (now_utc() + timedelta(minutes=15)).isoformat()}}, upsert=True)
        raise HTTPException(401, "Email ou senha incorretos")
    await db.login_attempts.delete_many({"identifier": ident})
    return {"token": create_access_token(user["id"], user["role"]), "user": public_user(user)}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api.post("/auth/logout")
async def logout():
    return {"ok": True}


# ---------- Public catalog ----------
@api.get("/")
async def root():
    return {"message": "Instituto Belozo API"}


@api.get("/services")
async def list_services():
    return clean(await db.services.find({"active": True}, NO_ID).sort("order", 1).to_list(100))


@api.get("/professionals")
async def list_professionals(service_id: Optional[str] = None):
    q = {"active": True}
    if service_id:
        q["service_ids"] = service_id
    return clean(await db.professionals.find(q, {"_id": 0, "id": 1, "name": 1, "specialty": 1, "bio": 1,
                                           "service_ids": 1, "is_sample": 1}).to_list(100))


@api.get("/availability")
async def availability(service_id: str, professional_id: str = "any", start: Optional[str] = None, days: int = 35):
    q = {"active": True, "service_ids": service_id}
    if professional_id != "any":
        q["id"] = professional_id
    profs = await db.professionals.find(q, NO_ID).to_list(100)
    first = parse_date(start) if start else now_local().date()
    first = max(first, now_local().date())
    days = min(max(days, 1), 62)
    last = first + timedelta(days=days - 1)
    booked = await booked_map([p["id"] for p in profs], first.isoformat(), last.isoformat())
    result = {}
    for i in range(days):
        d = first + timedelta(days=i)
        times = set()
        for p in profs:
            taken = booked.get((p["id"], d.isoformat()), set())
            times.update(t for t in day_slots(p, d) if t not in taken and is_future(d, t))
        if times:
            result[d.isoformat()] = sorted(times)
    return {"days": result}


# ---------- Client ----------
@api.post("/appointments")
async def create_appointment(body: AppointmentIn, user: dict = Depends(client_only)):
    service = await db.services.find_one({"id": body.service_id, "active": True}, NO_ID)
    if not service:
        raise HTTPException(404, "Serviço não encontrado")
    d = parse_date(body.date)
    if not is_future(d, body.time):
        raise HTTPException(400, "Escolha um horário futuro")
    q = {"active": True, "service_ids": service["id"]}
    if body.professional_id != "any":
        q["id"] = body.professional_id
    profs = await db.professionals.find(q, NO_ID).to_list(100)
    for prof in profs:
        if body.time not in day_slots(prof, d):
            continue
        doc = appt_doc(user, service, prof, body.date, body.time, "pending")
        try:
            await db.appointments.insert_one(doc)
        except DuplicateKeyError:
            continue
        doc.pop("_id", None)
        return doc
    raise HTTPException(409, "Este horário acabou de ser reservado. Escolha outro horário.")


@api.get("/appointments/mine")
async def my_appointments(user: dict = Depends(client_only)):
    return clean(await db.appointments.find({"client_id": user["id"]}, NO_ID).sort([("date", -1), ("time", -1)]).to_list(500))


@api.post("/appointments/{appt_id}/cancel")
async def client_cancel(appt_id: str, user: dict = Depends(client_only)):
    a = await db.appointments.find_one({"id": appt_id, "client_id": user["id"]}, NO_ID)
    if not a:
        raise HTTPException(404, "Agendamento não encontrado")
    if a["status"] == "cancelled":
        raise HTTPException(400, "Agendamento já cancelado")
    await db.appointments.update_one({"id": appt_id}, {"$set": {"status": "cancelled", "active": False,
                                                                "responded_at": now_utc().isoformat()}})
    prof = await db.professionals.find_one({"id": a["professional_id"]}, NO_ID)
    if prof:
        await notify("whatsapp", "cancelamento_cliente", prof["name"], prof.get("whatsapp", ""),
                     f"{a['client_name']} cancelou a sessão de {a['service_name']} em {fmt_br(a['date'])} às {fmt_hour(a['time'])}.",
                     {"appointment_id": appt_id})
    return {"ok": True}


@api.get("/records/mine")
async def my_records(user: dict = Depends(client_only)):
    return clean(await db.records.find({"client_id": user["id"]}, NO_ID).sort("date", -1).to_list(500))


# ---------- Admin: appointments ----------
@api.get("/admin/appointments")
async def admin_appointments(start: str, end: str, professional_id: Optional[str] = None,
                             user: dict = Depends(staff)):
    q = {"date": {"$gte": start, "$lte": end}, **scope_filter(user)}
    if professional_id and user["role"] == "admin":
        q["professional_id"] = professional_id
    return clean(await db.appointments.find(q, NO_ID).sort([("date", 1), ("time", 1)]).to_list(2000))


@api.get("/admin/summary")
async def admin_summary(user: dict = Depends(staff)):
    sf = scope_filter(user)
    cutoff = (now_utc() - timedelta(minutes=SLA_MINUTES)).isoformat()
    today = now_local().date().isoformat()
    pending = await db.appointments.find({"status": "pending", **sf}, NO_ID).sort("created_at", 1).to_list(500)
    return {
        "pending": len(pending),
        "overdue": sum(1 for a in pending if a["created_at"] < cutoff),
        "today": await db.appointments.count_documents({"date": today, "active": True, **sf}),
        "confirmed_today": await db.appointments.count_documents({"date": today, "status": "confirmed", **sf}),
        "pending_list": clean(pending),
        "sla_minutes": SLA_MINUTES,
    }


@api.post("/admin/appointments/{appt_id}/confirm")
async def admin_confirm(appt_id: str, user: dict = Depends(staff)):
    a = await get_scoped_appt(appt_id, user)
    if a["status"] != "pending":
        raise HTTPException(400, "Apenas agendamentos pendentes podem ser confirmados")
    await db.appointments.update_one({"id": appt_id}, {"$set": {"status": "confirmed",
                                                                "responded_at": now_utc().isoformat()}})
    await notify_client(a, "confirmacao",
                        f"Olá, {first_name(a['client_name'])}! Seu horário de {a['service_name']} com "
                        f"{a['professional_name']} em {fmt_br(a['date'])} às {fmt_hour(a['time'])} foi confirmado. "
                        f"Até lá! — Instituto Belozo")
    return {"ok": True}


@api.post("/admin/appointments/{appt_id}/cancel")
async def admin_cancel(appt_id: str, body: CancelIn, user: dict = Depends(staff)):
    a = await get_scoped_appt(appt_id, user)
    if a["status"] == "cancelled":
        raise HTTPException(400, "Agendamento já cancelado")
    await db.appointments.update_one({"id": appt_id}, {"$set": {"status": "cancelled", "active": False,
                                                                "responded_at": now_utc().isoformat()}})
    extra = ""
    if body.scope == "future" and a.get("recurrence_id"):
        await end_recurrence_from(a["recurrence_id"], a["date"])
        extra = " As próximas sessões semanais também foram canceladas."
    await notify_client(a, "cancelamento",
                        f"Olá, {first_name(a['client_name'])}. Sua sessão de {a['service_name']} em "
                        f"{fmt_br(a['date'])} às {fmt_hour(a['time'])} foi cancelada.{extra} "
                        f"Para remarcar, acesse o site do Instituto Belozo.")
    return {"ok": True}


@api.post("/admin/appointments/{appt_id}/reschedule")
async def admin_reschedule(appt_id: str, body: RescheduleIn, user: dict = Depends(staff)):
    a = await get_scoped_appt(appt_id, user)
    if a["status"] == "cancelled":
        raise HTTPException(400, "Não é possível reagendar um agendamento cancelado")
    d = parse_date(body.date)
    if not is_future(d, body.time):
        raise HTTPException(400, "Escolha um horário futuro")
    try:
        await db.appointments.update_one({"id": appt_id}, {"$set": {
            "date": body.date, "time": body.time, "status": "confirmed",
            "responded_at": a.get("responded_at") or now_utc().isoformat()}})
    except DuplicateKeyError:
        raise HTTPException(409, "Este horário já está ocupado para este profissional")
    a.update(date=body.date, time=body.time)
    result = {"ok": True, "created": [], "skipped": []}
    if a.get("recurrence_id"):
        await end_recurrence_from(a["recurrence_id"], a["date"] if a["date"] < body.date else body.date, appt_id)
        await db.appointments.update_one({"id": appt_id}, {"$set": {"recurrence_id": None}})
    msg = (f"Olá, {first_name(a['client_name'])}! Sua sessão de {a['service_name']} foi reagendada para "
           f"{fmt_br(body.date)} às {fmt_hour(body.time)} com {a['professional_name']}.")
    if body.mode == "weekly":
        rec = {"id": new_id(), "client_id": a["client_id"], "client_name": a["client_name"],
               "client_whatsapp": a.get("client_whatsapp", ""), "client_email": a.get("client_email", ""),
               "professional_id": a["professional_id"], "professional_name": a["professional_name"],
               "service_id": a["service_id"], "service_name": a["service_name"],
               "service_category": a.get("service_category", "personal"), "weekday": d.weekday(),
               "time": body.time, "start_date": body.date, "generated_until": body.date, "active": True,
               "skipped": [], "created_at": now_utc().isoformat()}
        await db.recurrences.insert_one(rec)
        await db.appointments.update_one({"id": appt_id}, {"$set": {"recurrence_id": rec["id"]}})
        gen = await generate_recurrence(rec)
        result.update(gen, recurrence_id=rec["id"])
        msg += f" A partir de agora, esse horário fica fixo toda {WEEKDAYS[d.weekday()]}."
        if gen["skipped"]:
            msg += f" Datas sem vaga (puladas): {', '.join(fmt_br(s) for s in gen['skipped'])}."
    await notify_client(a, "reagendamento", msg + " — Instituto Belozo")
    return result


@api.get("/admin/free-slots")
async def admin_free_slots(professional_id: str, date_str: str, exclude_id: Optional[str] = None,
                           user: dict = Depends(staff)):
    if user["role"] != "admin" and user.get("professional_id") != professional_id:
        raise HTTPException(403, "Acesso restrito")
    prof = await db.professionals.find_one({"id": professional_id}, NO_ID)
    if not prof:
        raise HTTPException(404, "Profissional não encontrado")
    d = parse_date(date_str)
    q = {"professional_id": professional_id, "date": date_str, "active": True}
    if exclude_id:
        q["id"] = {"$ne": exclude_id}
    taken = {a["time"] async for a in db.appointments.find(q, {"_id": 0, "time": 1})}
    return [t for t in day_slots(prof, d) if t not in taken and is_future(d, t)]


@api.get("/admin/occupancy")
async def admin_occupancy(start: str, days: int = 7, user: dict = Depends(staff)):
    q = {"active": True}
    if user["role"] != "admin":
        q["id"] = user.get("professional_id")
    profs = await db.professionals.find(q, NO_ID).to_list(100)
    first = parse_date(start)
    days = min(max(days, 1), 31)
    last = first + timedelta(days=days - 1)
    booked = await booked_map([p["id"] for p in profs], first.isoformat(), last.isoformat())
    out = []
    for p in profs:
        row = {"professional_id": p["id"], "name": p["name"], "days": []}
        for i in range(days):
            d = first + timedelta(days=i)
            slots = day_slots(p, d)
            taken = booked.get((p["id"], d.isoformat()), set())
            row["days"].append({"date": d.isoformat(), "total": len(slots),
                                "booked": len([t for t in taken if t in slots]) if slots else len(taken)})
        out.append(row)
    return out


# ---------- Admin: professionals & services ----------
@api.get("/admin/professionals")
async def admin_professionals(user: dict = Depends(staff)):
    q = {} if user["role"] == "admin" else {"id": user.get("professional_id")}
    profs = await db.professionals.find(q, NO_ID).sort("name", 1).to_list(200)
    for p in profs:
        u = await db.users.find_one({"professional_id": p["id"]}, {"_id": 0, "email": 1})
        p["login_email"] = u["email"] if u else None
    return clean(profs)


@api.post("/admin/professionals")
async def create_professional(body: ProfessionalIn, user: dict = Depends(admin_only)):
    prof = {"id": new_id(), "name": body.name, "whatsapp": body.whatsapp, "specialty": body.specialty,
            "bio": body.bio, "service_ids": body.service_ids, "session_minutes": body.session_minutes,
            "schedule": DEFAULT_SCHEDULE, "active": True, "is_sample": False, "created_at": now_utc().isoformat()}
    if body.email:
        if not body.password or len(body.password) < 6:
            raise HTTPException(400, "Defina uma senha com pelo menos 6 caracteres")
        if await db.users.find_one({"email": body.email.lower()}):
            raise HTTPException(400, "Este email já está cadastrado")
    await db.professionals.insert_one(prof)
    if body.email:
        await db.users.insert_one({"id": new_id(), "name": body.name, "email": body.email.lower(),
                                   "whatsapp": body.whatsapp, "role": "professional", "professional_id": prof["id"],
                                   "password_hash": hash_password(body.password), "created_at": now_utc().isoformat()})
    prof.pop("_id", None)
    return prof


@api.put("/admin/professionals/{prof_id}")
async def update_professional(prof_id: str, body: ProfessionalIn, user: dict = Depends(admin_only)):
    upd = body.model_dump(exclude={"email", "password"})
    res = await db.professionals.update_one({"id": prof_id}, {"$set": {**upd, "is_sample": False}})
    if not res.matched_count:
        raise HTTPException(404, "Profissional não encontrado")
    await db.users.update_one({"professional_id": prof_id}, {"$set": {"name": body.name, "whatsapp": body.whatsapp}})
    return clean(await db.professionals.find_one({"id": prof_id}, NO_ID))


@api.delete("/admin/professionals/{prof_id}")
async def deactivate_professional(prof_id: str, user: dict = Depends(admin_only)):
    await db.professionals.update_one({"id": prof_id}, {"$set": {"active": False}})
    return {"ok": True}


@api.put("/admin/professionals/{prof_id}/schedule")
async def update_schedule(prof_id: str, body: ScheduleIn, user: dict = Depends(staff)):
    if user["role"] != "admin" and user.get("professional_id") != prof_id:
        raise HTTPException(403, "Acesso restrito")
    sched = {}
    for k, blocks in body.schedule.items():
        if k not in {str(i) for i in range(7)}:
            raise HTTPException(400, "Dia inválido")
        for b in blocks:
            try:
                if time.fromisoformat(b.start) >= time.fromisoformat(b.end):
                    raise HTTPException(400, "O horário final deve ser depois do inicial")
            except ValueError:
                raise HTTPException(400, "Horário inválido")
        sched[k] = [b.model_dump() for b in blocks]
    await db.professionals.update_one({"id": prof_id}, {"$set": {"schedule": sched, "session_minutes": body.session_minutes}})
    return clean(await db.professionals.find_one({"id": prof_id}, NO_ID))


@api.get("/admin/services")
async def admin_services(user: dict = Depends(staff)):
    return clean(await db.services.find({}, NO_ID).sort("order", 1).to_list(100))


@api.post("/admin/services")
async def create_service(body: ServiceIn, user: dict = Depends(admin_only)):
    svc = {"id": new_id(), **body.model_dump(), "active": True, "is_sample": False,
           "order": await db.services.count_documents({}) + 1}
    await db.services.insert_one(svc)
    svc.pop("_id", None)
    return svc


@api.put("/admin/services/{svc_id}")
async def update_service(svc_id: str, body: ServiceIn, user: dict = Depends(admin_only)):
    await db.services.update_one({"id": svc_id}, {"$set": {**body.model_dump(), "is_sample": False}})
    return clean(await db.services.find_one({"id": svc_id}, NO_ID))


@api.post("/admin/services/{svc_id}/toggle")
async def toggle_service(svc_id: str, user: dict = Depends(admin_only)):
    s = await db.services.find_one({"id": svc_id}, NO_ID)
    if not s:
        raise HTTPException(404, "Serviço não encontrado")
    await db.services.update_one({"id": svc_id}, {"$set": {"active": not s["active"]}})
    return {"active": not s["active"]}


# ---------- Admin: clients & records ----------
async def ensure_client_access(client_id: str, user: dict) -> dict:
    c = await db.users.find_one({"id": client_id, "role": "client"}, {"_id": 0, "password_hash": 0})
    if not c:
        raise HTTPException(404, "Cliente não encontrado")
    if user["role"] != "admin" and not await db.appointments.find_one(
            {"client_id": client_id, "professional_id": user.get("professional_id")}):
        raise HTTPException(403, "Este cliente não é atendido por você")
    return c


@api.get("/admin/clients")
async def admin_clients(q: str = "", user: dict = Depends(staff)):
    filt = {"role": "client"}
    if user["role"] != "admin":
        ids = await db.appointments.distinct("client_id", {"professional_id": user.get("professional_id")})
        filt["id"] = {"$in": ids}
    if q:
        filt["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]
    clients = await db.users.find(filt, {"_id": 0, "password_hash": 0}).sort("name", 1).to_list(500)
    for c in clients:
        c["records_count"] = await db.records.count_documents({"client_id": c["id"], **scope_filter(user)})
        c["appointments_count"] = await db.appointments.count_documents({"client_id": c["id"], **scope_filter(user)})
    return clients


@api.get("/admin/clients/{client_id}")
async def admin_client_detail(client_id: str, user: dict = Depends(staff)):
    c = await ensure_client_access(client_id, user)
    sf = scope_filter(user)
    c["records"] = await db.records.find({"client_id": client_id, **sf}, NO_ID).sort("date", -1).to_list(500)
    c["appointments"] = await db.appointments.find({"client_id": client_id, **sf}, NO_ID).sort("date", -1).to_list(200)
    return c


@api.post("/admin/clients/{client_id}/records")
async def create_record(client_id: str, body: RecordIn, user: dict = Depends(staff)):
    c = await ensure_client_access(client_id, user)
    prof_id = user.get("professional_id")
    prof = await db.professionals.find_one({"id": prof_id}, NO_ID) if prof_id else None
    rec = {"id": new_id(), "client_id": client_id, "client_name": c["name"], **body.model_dump(),
           "professional_id": prof_id, "professional_name": prof["name"] if prof else user["name"],
           "created_at": now_utc().isoformat()}
    await db.records.insert_one(rec)
    rec.pop("_id", None)
    return rec


@api.delete("/admin/records/{record_id}")
async def delete_record(record_id: str, user: dict = Depends(staff)):
    res = await db.records.delete_one({"id": record_id, **scope_filter(user)})
    if not res.deleted_count:
        raise HTTPException(404, "Registro não encontrado")
    return {"ok": True}


# ---------- Notifications & daily summary ----------
@api.get("/admin/notifications")
async def admin_notifications(user: dict = Depends(staff)):
    q = {}
    if user["role"] != "admin":
        prof = await db.professionals.find_one({"id": user.get("professional_id")}, NO_ID) or {}
        appt_ids = await db.appointments.distinct("id", {"professional_id": user.get("professional_id")})
        q = {"$or": [{"meta.professional_id": user.get("professional_id")}, {"meta.appointment_id": {"$in": appt_ids}},
                     {"to": prof.get("whatsapp", "__none__")}]}
    return clean(await db.notifications.find(q, NO_ID).sort("created_at", -1).to_list(300))


async def run_daily_summary(professional_id: Optional[str] = None) -> List[dict]:
    today = now_local().date().isoformat()
    q = {"active": True}
    if professional_id:
        q["id"] = professional_id
    sent = []
    async for prof in db.professionals.find(q, NO_ID):
        appts = await db.appointments.find({"professional_id": prof["id"], "date": today, "active": True},
                                           NO_ID).sort("time", 1).to_list(100)
        name = first_name(prof["name"])
        if appts:
            items = ", ".join(f"{fmt_hour(a['time'])} - {first_name(a['client_name'])}"
                              + (" (pendente)" if a["status"] == "pending" else "") for a in appts)
            n = len(appts)
            msg = f"Bom dia, {name}! Você tem {n} paciente{'s' if n > 1 else ''} hoje: {items}."
        else:
            msg = f"Bom dia, {name}! Você não tem pacientes agendados para hoje."
        sent.append(await notify("whatsapp", "resumo_diario", prof["name"], prof.get("whatsapp", ""), msg,
                                 {"professional_id": prof["id"], "date": today}))
    return sent


async def extend_recurrences():
    async for rec in db.recurrences.find({"active": True}, NO_ID):
        await generate_recurrence(rec)


async def daily_job():
    await extend_recurrences()
    await run_daily_summary()


@api.post("/admin/daily-summary")
async def trigger_daily_summary(user: dict = Depends(staff)):
    pid = None if user["role"] == "admin" else user.get("professional_id")
    return await run_daily_summary(pid)


@api.post("/cron/daily-summary")
async def cron_daily_summary(request: Request, background: BackgroundTasks):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    if not token or not hmac.compare_digest(token, os.environ["WEBHOOK_CRON_SECRET"]):
        raise HTTPException(401, "Unauthorized")
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001
        body = {}
    if not isinstance(body, dict):
        raise HTTPException(400, "Invalid body")
    run_id = request.headers.get("X-Webhook-Id") or body.get("run_id") or new_id()
    try:
        await db.cron_runs.insert_one({"run_id": run_id, "name": "daily-summary", "at": now_utc().isoformat()})
    except DuplicateKeyError:
        return {"accepted": True, "duplicate": True}
    background.add_task(daily_job)
    return {"accepted": True}


# ---------- Startup ----------
SAMPLE_SERVICES = [
    {"name": "Avaliação Física", "category": "personal",
     "description": "Primeiro encontro: composição corporal, objetivos e plano de treino individual."},
    {"name": "Personal Training", "category": "personal",
     "description": "Treino individual acompanhado do início ao fim, com progressão de cargas."},
    {"name": "Avaliação Fisioterapêutica", "category": "fisio",
     "description": "Análise de dor, postura e mobilidade para definir o plano de tratamento."},
    {"name": "Fisioterapia", "category": "fisio",
     "description": "Sessões de reabilitação e prevenção com acompanhamento da sua evolução."},
]


async def seed():
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"id": new_id(), "name": "Administração Belozo", "email": admin_email,
                                   "whatsapp": "", "role": "admin", "professional_id": None,
                                   "password_hash": hash_password(admin_password), "created_at": now_utc().isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    if await db.services.count_documents({}) == 0:
        for i, s in enumerate(SAMPLE_SERVICES):
            await db.services.insert_one({"id": new_id(), **s, "active": True, "is_sample": True, "order": i + 1})
    if await db.professionals.count_documents({}) == 0:
        svcs = await db.services.find({}, NO_ID).to_list(100)
        by_cat = {c: [s["id"] for s in svcs if s["category"] == c] for c in ("personal", "fisio")}
        samples = [
            ("João Exemplo", "personal", "Personal Trainer", "joao.exemplo@belozo.com.br", "5511900000001"),
            ("Ana Exemplo", "fisio", "Fisioterapeuta", "ana.exemplo@belozo.com.br", "5511900000002"),
            ("Rafael Exemplo", "personal", "Personal Trainer", "rafael.exemplo@belozo.com.br", "5511900000003"),
        ]
        for name, cat, spec, email, wa in samples:
            pid = new_id()
            await db.professionals.insert_one({
                "id": pid, "name": name, "whatsapp": wa, "specialty": spec, "bio": "Profissional de exemplo — edite no painel.",
                "service_ids": by_cat[cat], "session_minutes": 60, "schedule": DEFAULT_SCHEDULE, "active": True,
                "is_sample": True, "created_at": now_utc().isoformat()})
            if not await db.users.find_one({"email": email}):
                await db.users.insert_one({"id": new_id(), "name": name, "email": email, "whatsapp": wa,
                                           "role": "professional", "professional_id": pid,
                                           "password_hash": hash_password(os.environ["SAMPLE_STAFF_PASSWORD"]),
                                           "created_at": now_utc().isoformat()})


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.appointments.create_index("id", unique=True)
    await db.appointments.create_index(
        [("professional_id", 1), ("date", 1), ("time", 1)], unique=True,
        partialFilterExpression={"active": True}, name="no_overbooking")
    await db.appointments.create_index([("client_id", 1), ("date", -1)])
    await db.cron_runs.create_index("run_id", unique=True)
    await db.notifications.create_index("created_at")
    await seed()


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
