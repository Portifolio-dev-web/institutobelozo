import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, CalendarClock, X, Repeat, Timer, FileText } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { RescheduleDialog } from "@/components/admin/RescheduleDialog";
import { CancelDialog } from "@/components/admin/CancelDialog";
import { useNow } from "@/hooks/useNow";
import { api, errMsg } from "@/lib/api";
import { minutesSince, fmtElapsed, fmtDate } from "@/lib/format";

const SLA = 60;

const Act = ({ onClick, children, testId, primary }) => (
  <button onClick={onClick} data-testid={testId}
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${primary ? "bg-moss text-cream hover:bg-moss-dark" : "border hover:border-moss hover:text-moss"}`}>
    {children}
  </button>
);

export const AppointmentCard = ({ a, onChanged, showDate }) => {
  const now = useNow();
  const [dialog, setDialog] = useState(null);
  const pending = a.status === "pending";
  const waited = pending ? minutesSince(a.created_at, now) : 0;
  const late = pending && waited >= SLA;

  const confirm = async () => {
    try { await api.post(`/admin/appointments/${a.id}/confirm`); toast.success("Confirmado — cliente notificado (simulado)"); onChanged(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div data-testid={`appt-card-${a.id}`} className={`rounded-xl border p-4 space-y-3 bg-white transition-shadow hover:shadow-md ${late ? "border-[#DC2626] bg-[#FEF2F2] ring-1 ring-[#DC2626]/40" : ""} ${a.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display font-semibold text-sm">{showDate && `${fmtDate(a.date)} · `}{a.time}</p>
        <div className="flex items-center gap-1.5">{a.recurrence_id && <Repeat className="w-3.5 h-3.5 text-gold" title="Recorrente" />}<StatusBadge status={a.status} testId={`appt-status-${a.id}`} /></div>
      </div>
      <div>
        <p className="font-medium leading-tight" data-testid={`appt-client-${a.id}`}>{a.client_name}</p>
        <p className="text-xs text-charcoal/55">{a.service_name} · {a.professional_name}</p>
      </div>
      {pending && (
        <p data-testid={`appt-sla-${a.id}`} className={`inline-flex items-center gap-1 text-xs font-medium ${late ? "text-[#DC2626]" : "text-[#0E7C7D]"}`}>
          <Timer className="w-3.5 h-3.5" /> {late ? "SLA estourado · " : "Aguardando há "}{fmtElapsed(waited)}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {pending && <Act primary onClick={confirm} testId={`appt-confirm-${a.id}`}><Check className="w-3.5 h-3.5" />Confirmar</Act>}
        {a.status !== "cancelled" && <Act onClick={() => setDialog("re")} testId={`appt-reschedule-${a.id}`}><CalendarClock className="w-3.5 h-3.5" />Reagendar</Act>}
        {a.status !== "cancelled" && <Act onClick={() => setDialog("cancel")} testId={`appt-cancel-${a.id}`}><X className="w-3.5 h-3.5" />Cancelar</Act>}
        <Link to={`/admin/clientes/${a.client_id}`} data-testid={`appt-record-link-${a.id}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs border hover:border-moss hover:text-moss"><FileText className="w-3.5 h-3.5" />Prontuário</Link>
      </div>
      {dialog === "re" && <RescheduleDialog appt={a} onClose={() => setDialog(null)} onDone={onChanged} />}
      {dialog === "cancel" && <CancelDialog appt={a} onClose={() => setDialog(null)} onDone={onChanged} />}
    </div>
  );
};
