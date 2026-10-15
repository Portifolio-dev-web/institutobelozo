import { useCallback, useEffect, useState } from "react";
import { ptBR } from "date-fns/locale";
import { Loader2, CalendarX } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { api, errMsg } from "@/lib/api";
import { toISO, fromISO, fmtLong, todayISO, addDays } from "@/lib/format";

export const StepDateTime = ({ service, profId, onDone }) => {
  const [days, setDays] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get("/availability", { params: { service_id: service.id, professional_id: profId, days: 60 } });
    setDays(r.data.days);
    return r.data.days;
  }, [service.id, profId]);

  useEffect(() => {
    load().then((d) => setDate(Object.keys(d)[0] || null));
  }, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.post("/appointments", { service_id: service.id, professional_id: profId, date, time });
      onDone(r.data);
    } catch (e) {
      toast.error(errMsg(e));
      setTime(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!days) return <Loader2 className="w-6 h-6 animate-spin text-moss" />;
  if (!Object.keys(days).length) {
    return <div className="rounded-2xl border bg-white p-10 text-center text-charcoal/60" data-testid="wizard-no-slots"><CalendarX className="w-8 h-8 mx-auto mb-3" />Sem horários livres nos próximos 60 dias.</div>;
  }
  const times = (date && days[date]) || [];
  return (
    <div className="grid lg:grid-cols-[auto,1fr] gap-8" data-testid="wizard-step-3-calendar">
      <div className="rounded-2xl border bg-white p-3 w-fit">
        <Calendar mode="single" locale={ptBR} selected={date ? fromISO(date) : undefined}
          onSelect={(d) => { if (d) { setDate(toISO(d)); setTime(null); } }}
          fromDate={fromISO(todayISO())} toDate={fromISO(addDays(todayISO(), 59))}
          disabled={(d) => !days[toISO(d)]} data-testid="wizard-calendar" />
      </div>
      <div className="space-y-6">
        <p className="font-display font-medium first-letter:uppercase" data-testid="wizard-selected-date">{date ? fmtLong(date) : "Escolha um dia"}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {times.map((t) => (
            <button key={t} onClick={() => setTime(t)} data-testid={`wizard-time-${t.replace(":", "")}`}
              className={`h-12 rounded-xl border text-sm font-medium transition-colors ${time === t ? "bg-moss text-cream border-moss" : "bg-white hover:border-moss"}`}>{t}</button>
          ))}
        </div>
        <button disabled={!time || busy} onClick={submit} data-testid="wizard-submit-button"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gold px-10 py-4 font-semibold text-charcoal disabled:opacity-40 hover:bg-[#d3b06a] transition-colors">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar agendamento
        </button>
      </div>
    </div>
  );
};
