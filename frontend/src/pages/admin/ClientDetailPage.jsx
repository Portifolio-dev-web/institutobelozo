import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EvolutionChart } from "@/components/evolution/EvolutionChart";
import { RecordTimeline } from "@/components/evolution/RecordTimeline";
import { RecordForm } from "@/components/admin/RecordForm";
import { StatusBadge } from "@/components/StatusBadge";
import { FullLoader } from "@/components/RequireAuth";
import { api, errMsg } from "@/lib/api";
import { fmtLong } from "@/lib/format";

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const [c, setC] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(() => api.get(`/admin/clients/${clientId}`).then((r) => setC(r.data)).catch((e) => setErr(errMsg(e))), [clientId]);
  useEffect(() => { load(); }, [load]);
  const del = async (r) => {
    if (!window.confirm("Excluir este registro?")) return;
    try { await api.delete(`/admin/records/${r.id}`); toast.success("Registro excluído"); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  if (err) return <p data-testid="client-detail-error">{err}</p>;
  if (!c) return <FullLoader />;
  return (
    <div className="space-y-8" data-testid="admin-client-detail-page">
      <Link to="/admin/clientes" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal" data-testid="client-detail-back"><ArrowLeft className="w-4 h-4" />Clientes</Link>
      <div>
        <p className="eyebrow">Mini-prontuário</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight" data-testid="client-detail-name">{c.name}</h1>
        <div className="mt-3 flex flex-wrap gap-5 text-sm text-charcoal/60">
          <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" />{c.whatsapp}</span>
          <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" />{c.email}</span>
        </div>
      </div>
      <Tabs defaultValue="evo">
        <TabsList className="rounded-full bg-white border p-1 h-11">
          <TabsTrigger value="evo" className="rounded-full" data-testid="client-detail-tab-evolution">Evolução</TabsTrigger>
          <TabsTrigger value="new" className="rounded-full" data-testid="client-detail-tab-new">Novo registro</TabsTrigger>
          <TabsTrigger value="appts" className="rounded-full" data-testid="client-detail-tab-appointments">Agendamentos</TabsTrigger>
        </TabsList>
        <TabsContent value="evo" className="mt-8 space-y-8">
          <div data-testid="admin-prontuario-chart"><EvolutionChart records={c.records} /></div>
          <RecordTimeline records={c.records} onDelete={del} />
        </TabsContent>
        <TabsContent value="new" className="mt-8"><RecordForm clientId={c.id} onSaved={load} /></TabsContent>
        <TabsContent value="appts" className="mt-8 space-y-3">
          {c.appointments.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-5 py-3" data-testid={`client-detail-appt-${a.id}`}>
              <span className="first-letter:uppercase">{fmtLong(a.date)} · {a.time} — {a.service_name} ({a.professional_name})</span>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
