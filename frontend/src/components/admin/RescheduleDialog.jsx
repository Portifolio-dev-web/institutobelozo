import { useEffect, useState } from "react";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { api, errMsg } from "@/lib/api";
import { toISO, fromISO, todayISO, fmtDate } from "@/lib/format";

export const RescheduleDialog = ({ appt, onClose, onDone }) => {
  const [date, setDate] = useState(appt.date >= todayISO() ? appt.date : todayISO());
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("single");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSlots(null);
    api.get("/admin/free-slots", { params: { professional_id: appt.professional_id, date_str: date, exclude_id: appt.id } })
      .then((r) => setSlots(r.data)).catch(() => setSlots([]));
  }, [date, appt.professional_id, appt.id]);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/admin/appointments/${appt.id}/reschedule`, { date, time, mode });
      const sk = r.data.skipped || [];
      toast.success(mode === "weekly" ? `Recorrência criada: ${r.data.created.length + 1} sessões abertas` : "Sessão reagendada — cliente notificado (simulado)");
      if (sk.length) toast.warning(`Datas puladas (já ocupadas): ${sk.map((d) => fmtDate(d)).join(", ")}`, { duration: 9000 });
      onDone();
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" data-testid="reschedule-dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Reagendar · {appt.client_name}</DialogTitle>
          <DialogDescription>Mantém o profissional {appt.professional_name}. Apenas horários livres são exibidos.</DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-[auto,1fr] gap-6">
          <Calendar mode="single" locale={ptBR} selected={fromISO(date)} onSelect={(d) => { if (d) { setDate(toISO(d)); setTime(null); } }}
            fromDate={fromISO(todayISO())} className="rounded-xl border w-fit" />
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2" data-testid="reschedule-slots">
              {slots === null ? <Loader2 className="w-5 h-5 animate-spin text-moss" /> : slots.length === 0 ? <p className="col-span-3 text-sm text-charcoal/55">Sem horários livres neste dia.</p> :
                slots.map((t) => <button key={t} onClick={() => setTime(t)} data-testid={`reschedule-time-${t.replace(":", "")}`} className={`h-10 rounded-lg border text-sm ${time === t ? "bg-moss text-cream border-moss" : "hover:border-moss"}`}>{t}</button>)}
            </div>
            <RadioGroup value={mode} onValueChange={setMode} className="space-y-2">
              <Label className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer"><RadioGroupItem value="single" data-testid="reschedule-mode-single" /><span><b className="font-medium">Só esta sessão</b><span className="block text-xs text-charcoal/55">Move apenas este agendamento</span></span></Label>
              <Label className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer"><RadioGroupItem value="weekly" data-testid="reschedule-mode-weekly" /><span><b className="font-medium">Sessão semanal fixa</b><span className="block text-xs text-charcoal/55">Repete toda semana até ser cancelada; semanas ocupadas são puladas</span></span></Label>
            </RadioGroup>
            <button disabled={!time || busy} onClick={submit} data-testid="reschedule-submit-button" className="w-full h-11 rounded-full bg-moss text-cream font-medium disabled:opacity-40 inline-flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}Salvar reagendamento
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
