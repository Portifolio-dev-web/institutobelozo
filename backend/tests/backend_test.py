"""
Instituto Belozo — Backend regression suite.

Covers: auth, catalog, availability, booking (incl. overbooking + "qualquer profissional"),
client area, admin confirm/reschedule/cancel + recurrence, SLA overdue, schedule, team/services CRUD,
clients + records, notifications, daily summary + cron auth, scope isolation (professional vs admin).
"""
import os
import time as pytime
import uuid
import threading
from datetime import datetime, timedelta, timezone

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].splitlines()[0]
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

# Direct DB handle (for SLA created_at hack + cleanup)
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
mc = MongoClient(MONGO_URL)
mdb = mc[DB_NAME]

ADMIN_EMAIL = "monitor.informatica25@gmail.com"
ADMIN_PASSWORD = "Belozo@Admin2026"
PRO_PASSWORD = "Belozo@2026"
JOAO_EMAIL = "joao.exemplo@belozo.com.br"
ANA_EMAIL = "ana.exemplo@belozo.com.br"
CRON_SECRET = os.environ.get("WEBHOOK_CRON_SECRET") or [l for l in open("/app/backend/.env") if l.startswith("WEBHOOK_CRON_SECRET=")][0].split("=",1)[1].strip().strip('"')


def _h(tok): return {"Authorization": f"Bearer {tok}"}


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def joao_token():
    r = requests.post(f"{API}/auth/login", json={"email": JOAO_EMAIL, "password": PRO_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def ana_token():
    r = requests.post(f"{API}/auth/login", json={"email": ANA_EMAIL, "password": PRO_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def services():
    r = requests.get(f"{API}/services")
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="session")
def pros():
    r = requests.get(f"{API}/professionals")
    assert r.status_code == 200
    return r.json()


def register_client(prefix="TEST_"):
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{suffix}@example.com"
    body = {"name": f"{prefix}User {suffix}", "whatsapp": f"5511{suffix[:8]}", "email": email, "password": "secret123"}
    r = requests.post(f"{API}/auth/register", json=body)
    assert r.status_code == 200, r.text
    data = r.json()
    data["password"] = "secret123"
    return data


@pytest.fixture(scope="session")
def client_a():
    return register_client()


@pytest.fixture(scope="session")
def client_b():
    return register_client()


# ---------- health ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "Instituto Belozo" in r.json().get("message", "")


# ---------- auth ----------
class TestAuth:
    def test_admin_login(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_h(admin_token))
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_pro_login(self, joao_token):
        r = requests.get(f"{API}/auth/me", headers=_h(joao_token))
        assert r.status_code == 200
        assert r.json()["role"] == "professional"
        assert r.json()["professional_id"]

    def test_bad_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_duplicate(self, client_a):
        r = requests.post(f"{API}/auth/register", json={
            "name": "dup", "whatsapp": "5511000000000", "email": client_a["user"]["email"], "password": "secret123"})
        assert r.status_code == 400

    def test_me_requires_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- catalog & availability ----------
class TestCatalog:
    def test_services_seeded(self, services):
        assert len(services) >= 4
        for s in services:
            assert "_id" not in s
            assert s["name"] and s["category"] in ("personal", "fisio")

    def test_professionals_seeded(self, pros):
        assert len(pros) >= 3
        assert any("João" in p["name"] for p in pros)

    def test_availability_any(self, services):
        svc = services[0]
        r = requests.get(f"{API}/availability", params={"service_id": svc["id"], "professional_id": "any", "days": 14})
        assert r.status_code == 200
        days = r.json()["days"]
        assert len(days) > 0, "No availability returned for seeded service"


# ---------- helpers for booking ----------
def pick_slot(service_id, professional_id="any"):
    r = requests.get(f"{API}/availability", params={"service_id": service_id, "professional_id": professional_id, "days": 20})
    days = r.json()["days"]
    for d in sorted(days):
        for t in days[d]:
            # skip very near times to be safe
            return d, t
    return None, None


# ---------- booking ----------
class TestBooking:
    def test_create_pending(self, client_a, services):
        personal = next(s for s in services if s["category"] == "personal" and "Personal" in s["name"])
        d, t = pick_slot(personal["id"])
        assert d, "no slot available"
        r = requests.post(f"{API}/appointments", headers=_h(client_a["token"]),
                          json={"service_id": personal["id"], "professional_id": "any", "date": d, "time": t})
        assert r.status_code == 200, r.text
        appt = r.json()
        assert appt["status"] == "pending"
        assert appt["client_id"] == client_a["user"]["id"]
        # Verify in /appointments/mine
        mine = requests.get(f"{API}/appointments/mine", headers=_h(client_a["token"])).json()
        assert any(a["id"] == appt["id"] for a in mine)
        # Slot should disappear from availability
        r2 = requests.get(f"{API}/availability", params={"service_id": personal["id"], "professional_id": appt["professional_id"], "days": 20})
        assert t not in r2.json()["days"].get(d, [])
        client_a["appt_id"] = appt["id"]
        client_a["appt"] = appt

    def test_overbooking_blocked(self, services):
        # Register two fresh clients to avoid interference
        c1 = register_client()
        c2 = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        # Find a slot on a specific professional
        pros_list = requests.get(f"{API}/professionals", params={"service_id": personal["id"]}).json()
        pro = pros_list[0]
        d, t = None, None
        avail = requests.get(f"{API}/availability", params={"service_id": personal["id"], "professional_id": pro["id"], "days": 20}).json()["days"]
        for dd in sorted(avail):
            if avail[dd]:
                d, t = dd, avail[dd][0]
                break
        assert d, "no slot found for specific pro"
        results = {}
        def book(k, tok):
            r = requests.post(f"{API}/appointments", headers=_h(tok),
                              json={"service_id": personal["id"], "professional_id": pro["id"], "date": d, "time": t})
            results[k] = r.status_code
        t1 = threading.Thread(target=book, args=("a", c1["token"]))
        t2 = threading.Thread(target=book, args=("b", c2["token"]))
        t1.start(); t2.start(); t1.join(); t2.join()
        statuses = sorted(results.values())
        # One success (200), one conflict (409)
        assert statuses == [200, 409], f"Expected [200,409] got {statuses}"

    def test_qualquer_profissional_fallback(self, services):
        # Book on pro A, then another client using "any" should get a different pro for same slot
        personal = next(s for s in services if s["category"] == "personal")
        pros_list = requests.get(f"{API}/professionals", params={"service_id": personal["id"]}).json()
        if len(pros_list) < 2:
            pytest.skip("Need >=2 pros for this service")
        pro_a = pros_list[0]
        # find slot available to pro_a
        avail = requests.get(f"{API}/availability", params={"service_id": personal["id"], "professional_id": pro_a["id"], "days": 20}).json()["days"]
        d, t = None, None
        for dd in sorted(avail):
            for tt in avail[dd]:
                # also must be free in pro_b
                avail_b = requests.get(f"{API}/availability", params={"service_id": personal["id"], "professional_id": pros_list[1]["id"], "days": 20}).json()["days"]
                if tt in avail_b.get(dd, []):
                    d, t = dd, tt
                    break
            if d: break
        assert d, "need common slot"
        c1 = register_client(); c2 = register_client()
        r1 = requests.post(f"{API}/appointments", headers=_h(c1["token"]),
                           json={"service_id": personal["id"], "professional_id": pro_a["id"], "date": d, "time": t})
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/appointments", headers=_h(c2["token"]),
                           json={"service_id": personal["id"], "professional_id": "any", "date": d, "time": t})
        assert r2.status_code == 200, r2.text
        assert r2.json()["professional_id"] != pro_a["id"]

    def test_client_cancel(self, services):
        c = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        d, t = pick_slot(personal["id"])
        r = requests.post(f"{API}/appointments", headers=_h(c["token"]),
                          json={"service_id": personal["id"], "professional_id": "any", "date": d, "time": t})
        aid = r.json()["id"]
        rc = requests.post(f"{API}/appointments/{aid}/cancel", headers=_h(c["token"]))
        assert rc.status_code == 200
        mine = requests.get(f"{API}/appointments/mine", headers=_h(c["token"])).json()
        appt = next(a for a in mine if a["id"] == aid)
        assert appt["status"] == "cancelled" and appt["active"] is False


# ---------- admin ----------
class TestAdmin:
    def test_summary(self, admin_token):
        r = requests.get(f"{API}/admin/summary", headers=_h(admin_token))
        assert r.status_code == 200
        s = r.json()
        for k in ("pending", "overdue", "today", "confirmed_today", "pending_list", "sla_minutes"):
            assert k in s
        assert s["sla_minutes"] == 60

    def test_confirm_creates_notifications(self, admin_token, services):
        c = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        d, t = pick_slot(personal["id"])
        r = requests.post(f"{API}/appointments", headers=_h(c["token"]),
                          json={"service_id": personal["id"], "professional_id": "any", "date": d, "time": t})
        aid = r.json()["id"]
        rc = requests.post(f"{API}/admin/appointments/{aid}/confirm", headers=_h(admin_token))
        assert rc.status_code == 200
        notifs = requests.get(f"{API}/admin/notifications", headers=_h(admin_token)).json()
        related = [n for n in notifs if n.get("meta", {}).get("appointment_id") == aid]
        channels = {n["channel"] for n in related}
        assert "whatsapp" in channels and "email" in channels, f"notifications channels: {channels}"

    def test_sla_overdue(self, admin_token, services):
        c = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        d, t = pick_slot(personal["id"])
        r = requests.post(f"{API}/appointments", headers=_h(c["token"]),
                          json={"service_id": personal["id"], "professional_id": "any", "date": d, "time": t})
        aid = r.json()["id"]
        # Push created_at to 2h ago
        old = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        mdb.appointments.update_one({"id": aid}, {"$set": {"created_at": old}})
        s = requests.get(f"{API}/admin/summary", headers=_h(admin_token)).json()
        assert s["overdue"] >= 1
        assert any(a["id"] == aid for a in s["pending_list"])

    def test_reschedule_single(self, admin_token, services):
        c = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        pros_list = requests.get(f"{API}/professionals", params={"service_id": personal["id"]}).json()
        pro = pros_list[0]
        avail = requests.get(f"{API}/availability", params={"service_id": personal["id"], "professional_id": pro["id"], "days": 20}).json()["days"]
        dates = sorted(avail)
        d1, t1 = dates[0], avail[dates[0]][0]
        d2, t2 = dates[1], avail[dates[1]][0]
        r = requests.post(f"{API}/appointments", headers=_h(c["token"]),
                          json={"service_id": personal["id"], "professional_id": pro["id"], "date": d1, "time": t1})
        aid = r.json()["id"]
        rr = requests.post(f"{API}/admin/appointments/{aid}/reschedule", headers=_h(admin_token),
                           json={"date": d2, "time": t2, "mode": "single"})
        assert rr.status_code == 200, rr.text
        assert rr.json()["ok"] is True

    def test_reschedule_weekly(self, admin_token, services):
        c = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        pros_list = requests.get(f"{API}/professionals", params={"service_id": personal["id"]}).json()
        pro = pros_list[0]
        avail = requests.get(f"{API}/availability", params={"service_id": personal["id"], "professional_id": pro["id"], "days": 40}).json()["days"]
        d1, t1 = next(iter(avail)), avail[next(iter(avail))][0]
        r = requests.post(f"{API}/appointments", headers=_h(c["token"]),
                          json={"service_id": personal["id"], "professional_id": pro["id"], "date": d1, "time": t1})
        aid = r.json()["id"]
        # reschedule weekly to same slot (or next day same time) — use same slot
        rr = requests.post(f"{API}/admin/appointments/{aid}/reschedule", headers=_h(admin_token),
                           json={"date": d1, "time": t1, "mode": "weekly"})
        assert rr.status_code == 200, rr.text
        data = rr.json()
        assert "recurrence_id" in data
        # Should have ~ RECURRENCE_WEEKS created
        assert len(data["created"]) >= 1
        # Cancel future
        rc = requests.post(f"{API}/admin/appointments/{aid}/cancel", headers=_h(admin_token),
                           json={"scope": "future"})
        assert rc.status_code == 200

    def test_cancel_single(self, admin_token, services):
        c = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        d, t = pick_slot(personal["id"])
        r = requests.post(f"{API}/appointments", headers=_h(c["token"]),
                          json={"service_id": personal["id"], "professional_id": "any", "date": d, "time": t})
        aid = r.json()["id"]
        rc = requests.post(f"{API}/admin/appointments/{aid}/cancel", headers=_h(admin_token),
                           json={"scope": "single"})
        assert rc.status_code == 200


# ---------- scope isolation ----------
class TestScope:
    def test_pro_cannot_access_admin_only(self, joao_token):
        r = requests.get(f"{API}/admin/professionals", headers=_h(joao_token))
        # Pro can list but only self
        assert r.status_code == 200
        data = r.json()
        assert all(p.get("is_sample") in (True, False) for p in data)
        assert len(data) == 1  # scoped to self

    def test_pro_cannot_create_pro(self, joao_token):
        r = requests.post(f"{API}/admin/professionals", headers=_h(joao_token),
                          json={"name": "x", "whatsapp": "1", "specialty": "y"})
        assert r.status_code == 403

    def test_pro_cannot_touch_other_pro_schedule(self, joao_token, pros):
        other = next(p for p in pros if "Ana" in p["name"])
        r = requests.put(f"{API}/admin/professionals/{other['id']}/schedule", headers=_h(joao_token),
                         json={"schedule": {"0": [{"start": "08:00", "end": "12:00"}]}, "session_minutes": 60})
        assert r.status_code == 403

    def test_pro_scoped_appointments(self, joao_token, admin_token):
        today = datetime.now().date()
        start = today.isoformat(); end = (today + timedelta(days=60)).isoformat()
        r = requests.get(f"{API}/admin/appointments", headers=_h(joao_token),
                        params={"start": start, "end": end})
        assert r.status_code == 200
        joao_prof_id = requests.get(f"{API}/auth/me", headers=_h(joao_token)).json()["professional_id"]
        for a in r.json():
            assert a["professional_id"] == joao_prof_id


# ---------- team & services crud ----------
class TestTeamServices:
    def test_create_service_and_toggle(self, admin_token):
        name = f"TEST_svc_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/admin/services", headers=_h(admin_token),
                          json={"name": name, "category": "personal", "description": "x"})
        assert r.status_code == 200
        sid = r.json()["id"]
        rt = requests.post(f"{API}/admin/services/{sid}/toggle", headers=_h(admin_token))
        assert rt.status_code == 200 and rt.json()["active"] is False
        # Cleanup
        mdb.services.delete_one({"id": sid})

    def test_create_professional_with_login(self, admin_token):
        email = f"test_pro_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/admin/professionals", headers=_h(admin_token),
                          json={"name": "TEST_Pro", "whatsapp": "5511000000000", "specialty": "x",
                                "email": email, "password": "secret123", "service_ids": [], "session_minutes": 60})
        assert r.status_code == 200
        pid = r.json()["id"]
        # Login as new pro
        rl = requests.post(f"{API}/auth/login", json={"email": email, "password": "secret123"})
        assert rl.status_code == 200
        # cleanup
        mdb.professionals.delete_one({"id": pid})
        mdb.users.delete_one({"email": email})

    def test_schedule_update(self, admin_token, pros):
        pid = next(p for p in pros if "João" in p["name"])["id"]
        r = requests.put(f"{API}/admin/professionals/{pid}/schedule", headers=_h(admin_token),
                         json={"schedule": {"0": [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}],
                                            "1": [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}],
                                            "2": [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}],
                                            "3": [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}],
                                            "4": [{"start": "08:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}]},
                               "session_minutes": 60})
        assert r.status_code == 200


# ---------- records (mini-prontuário) ----------
class TestRecords:
    def test_create_record_and_client_read(self, admin_token, services):
        c = register_client()
        personal = next(s for s in services if s["category"] == "personal")
        d, t = pick_slot(personal["id"])
        requests.post(f"{API}/appointments", headers=_h(c["token"]),
                      json={"service_id": personal["id"], "professional_id": "any", "date": d, "time": t})
        rec = requests.post(f"{API}/admin/clients/{c['user']['id']}/records", headers=_h(admin_token),
                            json={"date": d, "notes": "ok", "weight": 70.5, "pain": 3, "mobility": "boa",
                                  "exercises": [{"name": "Agachamento", "sets": 3, "reps": 12, "load": 20}],
                                  "recovery_notes": ""})
        assert rec.status_code == 200
        rid = rec.json()["id"]
        # client reads
        mine = requests.get(f"{API}/records/mine", headers=_h(c["token"])).json()
        assert any(r["id"] == rid for r in mine)


# ---------- daily summary + cron auth ----------
class TestCron:
    def test_cron_requires_auth(self):
        r = requests.post(f"{API}/cron/daily-summary", json={})
        assert r.status_code == 401

    def test_cron_wrong_secret(self):
        r = requests.post(f"{API}/cron/daily-summary", json={}, headers={"Authorization": "Bearer wrong"})
        assert r.status_code == 401

    def test_cron_ok(self):
        r = requests.post(f"{API}/cron/daily-summary", json={"run_id": uuid.uuid4().hex},
                         headers={"Authorization": f"Bearer {CRON_SECRET}"})
        assert r.status_code == 200 and r.json().get("accepted") is True

    def test_daily_summary_button(self, admin_token):
        r = requests.post(f"{API}/admin/daily-summary", headers=_h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- cleanup ----------
def test_zz_cleanup():
    # Delete TEST_ users + their data
    users = list(mdb.users.find({"name": {"$regex": "^TEST_"}}, {"id": 1}))
    ids = [u["id"] for u in users]
    if ids:
        mdb.appointments.delete_many({"client_id": {"$in": ids}})
        mdb.records.delete_many({"client_id": {"$in": ids}})
        mdb.users.delete_many({"id": {"$in": ids}})
    # Delete test pros/services already handled in-tests; sweep leftover
    mdb.professionals.delete_many({"name": {"$regex": "^TEST_"}})
    mdb.services.delete_many({"name": {"$regex": "^TEST_"}})
    mdb.users.delete_many({"email": {"$regex": "^test_pro_"}})
    mdb.users.delete_many({"email": {"$regex": "^test_"}})
    mdb.recurrences.delete_many({"client_name": {"$regex": "^TEST_"}})
    mdb.notifications.delete_many({"meta.professional_id": {"$exists": False}, "to": {"$regex": "@example.com"}})
    print("cleanup done, removed", len(ids), "test users")
