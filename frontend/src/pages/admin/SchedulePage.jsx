import { useEffect, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errMsg } from "@/lib/api";
import { WEEKDAYS } from "@/lib/format";

const DURATIONS = [30, 45, 50, 60, 90];

const DayRow = ({ i, blocks, onChange }) => {
  const on = blocks.length > 0;
  const upd = (j, k, v) => onChange(blocks.map((b, x) => (x === j ? { ...b, [k]: v } : b)));
  return (
    <div className="grid sm:grid-cols-[160px,1fr] gap-4 py-4 border-b last:border-0" data-testid={`schedule-day-${i}`}>
      <label className="flex items-center gap-3 font-medium">
        <Switch checked={on} onCheckedChange={(c) => onChange(c ? [{ start: "08:00", end: "12:00" }] : [])} data-testid={`schedule-day-toggle-${i}`} />{WEEKDAYS[i]}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {blocks.map((b, j) => (
          <div key={j} className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5">
            <input type="time" value={b.start} onChange={(e) => upd(j, "start", e.target.value)} className="bg-transparent text-sm" data-testid={`schedule-start-${i}-${j}`} />
            <span className="text-charcoal/40">–</span>
            <input type="time" value={b.end} onChange={(e) => upd(j, "end", e.target.value)} className="bg-transparent text-sm" data-testid={`schedule-end-${i}-${j}`} />
            <button onClick={() => onChange(blocks.filter((_, x) => x !== j))} className="text-charcoal/40 hover:text-charcoal"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {on && <button onClick={() => onChange([...blocks, { start: "14:00", end: "18:00" }])} className="inline-flex items-center gap-1 text-sm text-moss" data-testid={`schedule-add-block-${i}`}><Plus className="w-4 h-4" />Turno</button>}
        {!on && <span className="text-sm text-charcoal/40">Sem atendimento</span>}
      </div>
    </div>
  );
};

export default function SchedulePage() {
  const [profs, setProfs] = useState([]);
  const [pid, setPid] = useState(null);
  const [sched, setSched] = useState({});
  const [dur, setDur] = useState(60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/professionals").then((r) => {
      const list = r.data.filter((p) => p.active);
      setProfs(list);
      if (list[0]) setPid(list[0].id);
    });
  }, []);
  useEffect(() => {
    const p = profs.find((x) => x.id === pid);
    if (p) { setSched(p.schedule || {}); setDur(p.session_minutes || 60); }
  }, [pid, profs]);

  const save = async () => {
    setBusy(true);
    try {
      const r = await api.put(`/admin/professionals/${pid}/schedule`, { schedule: sched, session_minutes: dur });
      setProfs(profs.map((p) => (p.id === pid ? { ...p, ...r.data } : p)));
      toast.success("Grade atualizada");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-8 max-w-4xl" data-testid="admin-schedule-page">
      <div><p className="eyebrow">Disponibilidade</p><h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Grade semanal</h1></div>
      <div className="flex flex-wrap gap-3">
        {profs.length > 1 && (
          <Select value={pid || ""} onValueChange={setPid}>
            <SelectTrigger className="w-[220px] rounded-full bg-white" data-testid="schedule-prof-select"><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>{profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <Select value={String(dur)} onValueChange={(v) => setDur(Number(v))}>
          <SelectTrigger className="w-[200px] rounded-full bg-white" data-testid="schedule-duration-select"><SelectValue /></SelectTrigger>
          <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>Sessão de {d} min</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="rounded-2xl border bg-white/70 px-5 sm:px-8">
        {WEEKDAYS.map((_, i) => <DayRow key={i} i={i} blocks={sched[String(i)] || []} onChange={(b) => setSched({ ...sched, [String(i)]: b })} />)}
      </div>
      <button onClick={save} disabled={!pid || busy} className="inline-flex items-center gap-2 rounded-full bg-moss text-cream px-8 h-11 font-medium disabled:opacity-50" data-testid="schedule-save-button">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}Salvar grade
      </button>
    </div>
  );
}
