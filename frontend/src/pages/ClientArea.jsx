import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SimpleHeader } from "@/components/SimpleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EvolutionChart } from "@/components/evolution/EvolutionChart";
import { RecordTimeline } from "@/components/evolution/RecordTimeline";
import { useAuth } from "@/context/AuthContext";
import { api, errMsg } from "@/lib/api";
import { fmtLong, todayISO } from "@/lib/format";

const ApptRow = ({ a, onCancel }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-white p-5 sm:p-6" data-testid={`my-appt-${a.id}`}>
    <div>
      <div className="flex items-center gap-3"><StatusBadge status={a.status} testId={`my-appt-status-${a.id}`} />{a.recurrence_id && <Repeat className="w-4 h-4 text-gold" />}</div>
      <p className="mt-3 font-display font-semibold first-letter:uppercase">{fmtLong(a.date)} · {a.time}</p>
      <p className="text-sm text-charcoal/60">{a.service_name} com {a.professional_name}</p>
    </div>
    {onCancel && a.status !== "cancelled" && (
      <AlertDialog>
        <AlertDialogTrigger className="text-sm text-charcoal/60 hover:text-charcoal underline underline-offset-4" data-testid={`my-appt-cancel-${a.id}`}>Cancelar</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancelar esta sessão?</AlertDialogTitle><AlertDialogDescription>O horário será liberado para outras pessoas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel><AlertDialogAction onClick={() => onCancel(a)} data-testid={`my-appt-cancel-confirm-${a.id}`}>Cancelar sessão</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
  </div>
);

export default function ClientArea() {
  const { user } = useAuth();
  const [appts, setAppts] = useState([]);
  const [records, setRecords] = useState([]);
  const load = useCallback(() => {
    api.get("/appointments/mine").then((r) => setAppts(r.data));
    api.get("/records/mine").then((r) => setRecords(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);

  const cancel = async (a) => {
    try { await api.post(`/appointments/${a.id}/cancel`); toast.success("Sessão cancelada"); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const today = todayISO();
  const upcoming = appts.filter((a) => a.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = appts.filter((a) => a.date < today);

  return (
    <div className="min-h-screen bg-cream" data-testid="client-area-page">
      <SimpleHeader />
      <main className="container-x max-w-5xl py-14 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div><p className="eyebrow">Minha área</p><h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Olá, <span className="font-serif italic font-medium text-moss">{user.name.split(" ")[0]}</span></h1></div>
          <Link to="/agendar" className="inline-flex items-center gap-2 rounded-full bg-moss text-cream px-6 py-3 hover:bg-moss-dark transition-colors" data-testid="client-new-booking-button"><Plus className="w-4 h-4" /> Novo agendamento</Link>
        </div>
        <Tabs defaultValue="appts">
          <TabsList className="h-12 rounded-full bg-[#EAE8E0] p-1">
            <TabsTrigger value="appts" className="rounded-full px-5" data-testid="client-tab-appointments">Meus Agendamentos</TabsTrigger>
            <TabsTrigger value="evo" className="rounded-full px-5" data-testid="client-tab-evolution">Minha Evolução</TabsTrigger>
          </TabsList>
          <TabsContent value="appts" className="mt-10 space-y-10">
            <section className="space-y-4"><p className="font-display font-medium">Próximas sessões</p>
              {upcoming.length ? upcoming.map((a) => <ApptRow key={a.id} a={a} onCancel={cancel} />) : <p className="text-sm text-charcoal/55" data-testid="client-no-upcoming">Nenhuma sessão agendada.</p>}
            </section>
            {past.length > 0 && <section className="space-y-4 opacity-75"><p className="font-display font-medium">Histórico</p>{past.map((a) => <ApptRow key={a.id} a={a} />)}</section>}
          </TabsContent>
          <TabsContent value="evo" className="mt-10 space-y-10">
            <EvolutionChart records={records} />
            <RecordTimeline records={records} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
