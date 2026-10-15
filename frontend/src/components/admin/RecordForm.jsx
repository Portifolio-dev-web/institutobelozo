import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { api, errMsg } from "@/lib/api";
import { todayISO } from "@/lib/format";

const EMPTY = { date: todayISO(), weight: "", pain: 0, mobility: "", notes: "", recovery_notes: "", exercises: [] };
const num = (v) => (v === "" || v == null ? null : Number(v));

const F = ({ label, children }) => <div className="space-y-2"><Label className="text-xs uppercase tracking-[0.12em] text-charcoal/55">{label}</Label>{children}</div>;

export const RecordForm = ({ clientId, onSaved }) => {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setEx = (i, k, v) => setF({ ...f, exercises: f.exercises.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/admin/clients/${clientId}/records`, {
        ...f, weight: num(f.weight), pain: f.pain,
        exercises: f.exercises.filter((x) => x.name.trim()).map((x) => ({ name: x.name, sets: num(x.sets), reps: num(x.reps), load: num(x.load) })),
      });
      toast.success("Registro salvo no prontuário");
      setF({ ...EMPTY, date: todayISO() });
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-white p-5 sm:p-8 space-y-6" data-testid="record-form">
      <div className="grid sm:grid-cols-3 gap-5">
        <F label="Data"><Input type="date" required value={f.date} onChange={set("date")} data-testid="record-date-input" /></F>
        <F label="Peso (kg)"><Input type="number" step="0.1" value={f.weight} onChange={set("weight")} data-testid="record-weight-input" /></F>
        <F label="Mobilidade / amplitude"><Input value={f.mobility} onChange={set("mobility")} placeholder="ex: flexão de joelho 110°" data-testid="record-mobility-input" /></F>
      </div>
      <F label={`Dor: ${f.pain}/10`}><Slider min={0} max={10} step={1} value={[f.pain]} onValueChange={([v]) => setF({ ...f, pain: v })} data-testid="record-pain-slider" /></F>
      <F label="Observações da sessão"><Textarea rows={3} value={f.notes} onChange={set("notes")} data-testid="record-notes-input" /></F>
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-[0.12em] text-charcoal/55">Cargas por exercício</Label>
        {f.exercises.map((x, i) => (
          <div key={i} className="grid grid-cols-[1fr,64px,64px,80px,32px] gap-2 items-center" data-testid={`record-exercise-row-${i}`}>
            <Input placeholder="Exercício" value={x.name} onChange={(e) => setEx(i, "name", e.target.value)} data-testid={`record-exercise-name-${i}`} />
            <Input placeholder="Séries" type="number" value={x.sets} onChange={(e) => setEx(i, "sets", e.target.value)} data-testid={`record-exercise-sets-${i}`} />
            <Input placeholder="Reps" type="number" value={x.reps} onChange={(e) => setEx(i, "reps", e.target.value)} data-testid={`record-exercise-reps-${i}`} />
            <Input placeholder="kg" type="number" step="0.5" value={x.load} onChange={(e) => setEx(i, "load", e.target.value)} data-testid={`record-exercise-load-${i}`} />
            <button type="button" onClick={() => setF({ ...f, exercises: f.exercises.filter((_, j) => j !== i) })} className="text-charcoal/40 hover:text-charcoal"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => setF({ ...f, exercises: [...f.exercises, { name: "", sets: "", reps: "", load: "" }] })} className="inline-flex items-center gap-1 text-sm text-moss" data-testid="record-add-exercise-button"><Plus className="w-4 h-4" />Adicionar exercício</button>
      </div>
      <F label="Notas de recuperação física"><Textarea rows={2} value={f.recovery_notes} onChange={set("recovery_notes")} data-testid="record-recovery-input" /></F>
      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-moss text-cream px-8 h-11 font-medium disabled:opacity-50" data-testid="record-submit-button">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}Salvar registro
      </button>
    </form>
  );
};
