const TZ = "America/Sao_Paulo";

export const todayISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

export const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromISO = (iso) => new Date(`${iso}T12:00:00`);

export const addDays = (iso, n) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const weekStart = (iso) => {
  const d = fromISO(iso);
  const diff = (d.getDay() + 6) % 7;
  return addDays(iso, -diff);
};

export const fmtDate = (iso, opts = { day: "2-digit", month: "short" }) =>
  fromISO(iso).toLocaleDateString("pt-BR", opts);

export const fmtLong = (iso) => fmtDate(iso, { weekday: "long", day: "2-digit", month: "long" });

export const fmtDateTime = (isoTs) =>
  new Date(isoTs).toLocaleString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const minutesSince = (isoTs, now = Date.now()) => Math.max(0, Math.floor((now - new Date(isoTs).getTime()) / 60000));

export const fmtElapsed = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ${String(min % 60).padStart(2, "0")}min`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
};

export const STATUS = {
  pending: { label: "Pendente", cls: "bg-gold/15 text-[#8a6a2a] border-gold/40" },
  confirmed: { label: "Confirmado", cls: "bg-moss/10 text-moss border-moss/30" },
  cancelled: { label: "Cancelado", cls: "bg-charcoal/5 text-charcoal/50 border-charcoal/15" },
};

export const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const maskPhone = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const daySlots = (prof, iso) => {
  if (!prof) return [];
  const wd = (fromISO(iso).getDay() + 6) % 7;
  const blocks = prof.schedule?.[String(wd)] || [];
  const dur = prof.session_minutes || 60;
  const out = new Set();
  blocks.forEach((b) => {
    const [sh, sm] = b.start.split(":").map(Number);
    const [eh, em] = b.end.split(":").map(Number);
    for (let t = sh * 60 + sm; t + dur <= eh * 60 + em; t += dur) {
      out.add(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
    }
  });
  return [...out].sort();
};
