import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { ProfessionalDialog, ServiceDialog } from "@/components/admin/TeamDialogs";
import { api, errMsg } from "@/lib/api";

const Sample = () => <span className="rounded-full bg-gold/20 text-[#0E7C7D] px-2 py-0.5 text-[10px] uppercase tracking-wider">Exemplo</span>;

export default function TeamPage() {
  const [profs, setProfs] = useState([]);
  const [svcs, setSvcs] = useState([]);
  const [dlg, setDlg] = useState(null);
  const load = useCallback(() => {
    api.get("/admin/professionals").then((r) => setProfs(r.data));
    api.get("/admin/services").then((r) => setSvcs(r.data));
  }, []);
  useEffect(() => { load(); }, [load]);
  const deactivate = async (p) => {
    if (!window.confirm(`Desativar ${p.name}? Ele deixará de aparecer no agendamento.`)) return;
    try { await api.delete(`/admin/professionals/${p.id}`); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const toggleSvc = async (s) => { await api.post(`/admin/services/${s.id}/toggle`); load(); };
  const svcName = (id) => svcs.find((s) => s.id === id)?.name;

  return (
    <div className="space-y-12" data-testid="admin-team-page">
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div><p className="eyebrow">Equipe</p><h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Profissionais</h1></div>
          <button onClick={() => setDlg({ type: "prof" })} className="inline-flex items-center gap-2 rounded-full bg-moss text-cream px-5 h-10 text-sm" data-testid="team-add-prof-button"><Plus className="w-4 h-4" />Profissional</button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {profs.map((p) => (
            <div key={p.id} className={`rounded-2xl border bg-white p-5 ${p.active ? "" : "opacity-50"}`} data-testid={`team-prof-${p.id}`}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-display font-semibold flex items-center gap-2">{p.name} {p.is_sample && <Sample />}</p>
                  <p className="text-xs text-charcoal/55">{p.specialty} · WhatsApp {p.whatsapp}{p.login_email ? ` · login ${p.login_email}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setDlg({ type: "prof", item: p })} className="p-2 rounded-full hover:bg-moss/10" data-testid={`team-prof-edit-${p.id}`}><Pencil className="w-4 h-4" /></button>
                  {p.active && <button onClick={() => deactivate(p)} className="p-2 rounded-full hover:bg-moss/10" data-testid={`team-prof-deactivate-${p.id}`}><Power className="w-4 h-4" /></button>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{p.service_ids.map((id) => svcName(id) && <span key={id} className="rounded-full bg-moss/10 text-moss px-2.5 py-0.5 text-xs">{svcName(id)}</span>)}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Serviços</h2>
          <button onClick={() => setDlg({ type: "svc" })} className="inline-flex items-center gap-2 rounded-full bg-moss text-cream px-5 h-10 text-sm" data-testid="team-add-service-button"><Plus className="w-4 h-4" />Serviço</button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {svcs.map((s) => (
            <div key={s.id} className={`rounded-2xl border bg-white p-5 flex justify-between gap-4 ${s.active ? "" : "opacity-50"}`} data-testid={`team-service-${s.id}`}>
              <div>
                <p className="font-display font-semibold flex items-center gap-2">{s.name} {s.is_sample && <Sample />}</p>
                <p className="text-xs text-charcoal/55">{s.category === "personal" ? "Personal Training" : "Fisioterapia"}</p>
                <p className="mt-2 text-sm text-charcoal/65">{s.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setDlg({ type: "svc", item: s })} className="p-2 rounded-full hover:bg-moss/10 h-fit" data-testid={`team-service-edit-${s.id}`}><Pencil className="w-4 h-4" /></button>
                <button onClick={() => toggleSvc(s)} className="p-2 rounded-full hover:bg-moss/10 h-fit" title={s.active ? "Desativar" : "Ativar"} data-testid={`team-service-toggle-${s.id}`}><Power className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {dlg?.type === "prof" && <ProfessionalDialog prof={dlg.item} services={svcs} onClose={() => setDlg(null)} onSaved={load} />}
      {dlg?.type === "svc" && <ServiceDialog svc={dlg.item} onClose={() => setDlg(null)} onSaved={load} />}
    </div>
  );
}
