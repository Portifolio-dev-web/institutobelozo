"""WhatsApp/email notification service. Set WHATSAPP_PROVIDER to evolution | zapi | twilio to send for real."""
import os
import logging

import httpx

from core import db, new_id, now_utc

logger = logging.getLogger("notifications")


class SimulatedProvider:
    name = "simulado"

    async def send(self, to: str, message: str) -> str:
        logger.info("[SIMULADO] WhatsApp para %s: %s", to, message)
        return "simulado"


class EvolutionAPIProvider:
    name = "evolution"

    async def send(self, to: str, message: str) -> str:
        url = f"{os.environ['EVOLUTION_API_URL']}/message/sendText/{os.environ['EVOLUTION_INSTANCE']}"
        async with httpx.AsyncClient(timeout=15) as http:
            r = await http.post(url, headers={"apikey": os.environ["EVOLUTION_API_KEY"]},
                                json={"number": to, "text": message})
            r.raise_for_status()
        return "enviado"


class ZAPIProvider:
    name = "zapi"

    async def send(self, to: str, message: str) -> str:
        url = (f"https://api.z-api.io/instances/{os.environ['ZAPI_INSTANCE']}"
               f"/token/{os.environ['ZAPI_TOKEN']}/send-text")
        async with httpx.AsyncClient(timeout=15) as http:
            r = await http.post(url, headers={"Client-Token": os.environ["ZAPI_CLIENT_TOKEN"]},
                                json={"phone": to, "message": message})
            r.raise_for_status()
        return "enviado"


class TwilioProvider:
    name = "twilio"

    async def send(self, to: str, message: str) -> str:
        sid = os.environ["TWILIO_ACCOUNT_SID"]
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        data = {"From": f"whatsapp:{os.environ['TWILIO_WHATSAPP_FROM']}", "To": f"whatsapp:+{to}", "Body": message}
        async with httpx.AsyncClient(timeout=15) as http:
            r = await http.post(url, data=data, auth=(sid, os.environ["TWILIO_AUTH_TOKEN"]))
            r.raise_for_status()
        return "enviado"


PROVIDERS = {"simulated": SimulatedProvider, "evolution": EvolutionAPIProvider,
             "zapi": ZAPIProvider, "twilio": TwilioProvider}


def whatsapp_provider():
    return PROVIDERS[os.environ["WHATSAPP_PROVIDER"]]()


def only_digits(value: str) -> str:
    return "".join(c for c in (value or "") if c.isdigit())


async def notify(channel: str, kind: str, recipient_name: str, to: str, message: str, meta: dict | None = None):
    status = "simulado"
    provider = "simulado"
    if channel == "whatsapp" and to:
        p = whatsapp_provider()
        provider = p.name
        try:
            status = await p.send(only_digits(to), message)
        except Exception as e:  # noqa: BLE001
            logger.exception("Falha ao enviar WhatsApp")
            status = f"erro: {e}"
    doc = {"id": new_id(), "channel": channel, "kind": kind, "recipient_name": recipient_name,
           "to": to, "message": message, "status": status, "provider": provider,
           "meta": meta or {}, "created_at": now_utc().isoformat()}
    await db.notifications.insert_one(doc)
    doc.pop("_id", None)
    return doc


async def notify_client(appt: dict, kind: str, message: str):
    meta = {"appointment_id": appt["id"]}
    await notify("whatsapp", kind, appt["client_name"], appt.get("client_whatsapp", ""), message, meta)
    await notify("email", kind, appt["client_name"], appt.get("client_email", ""), message, meta)
