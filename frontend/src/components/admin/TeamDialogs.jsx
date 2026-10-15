import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { api, errMsg } from "@/lib/api";

const F = ({ label, children }) => <div className="space-y-1.5"><Label className="text-xs text-charcoal/60">{label}</Label>{children}</div>;

export const ProfessionalDialog = ({ prof, services, onClose, onSaved }) => {
  const [f, setF] = useState({ name: prof?.name || "", whatsapp: prof?.whatsapp || "", specialty: prof?.specialty || "", bio: prof?.bio || "",
    service_ids: prof?.service_ids || [], session_minutes: prof?.session_minutes || 60, email: "", password: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (id) => setF({ ...f, service_ids: f.service_ids.includes(id) ? f.service_ids.filter((x) => x !== id) : [...f.service_ids, id] });
  const save = async () => {
    try {
      const body = { ...f, email: f.email || null, password: f.password || null };
      if (prof) await api.put(`/admin/professionals/${prof.id}`, body); else await api.post("/admin/professionals", body);
      toast.success("Profissional salvo");
      onSaved();
      onClose();
    } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto" data-testid="professional-dialog">
        <DialogHeader><DialogTitle className="font-display">{prof ? "Editar profissional" : "Novo profissional"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <F label="Nome"><Input value={f.name} onChange={set("name")} data-testid="prof-name-input" /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="WhatsApp (com DDI, ex: 5511...)"><Input value={f.whatsapp} onChange={set("whatsapp")} data-testid="prof-whatsapp-input" /></F>
            <F label="Especialidade"><Input value={f.specialty} onChange={set("specialty")} data-testid="prof-specialty-input" /></F>
          </div>
          <F label="Bio"><Textarea rows={2} value={f.bio} onChange={set("bio")} data-testid="prof-bio-input" /></F>
          <F label="Serviços que atende">
            <div className="grid grid-cols-2 gap-2">{services.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm"><Checkbox checked={f.service_ids.includes(s.id)} onCheckedChange={() => toggle(s.id)} data-testid={`prof-service-${s.id}`} />{s.name}</label>
            ))}</div>
          </F>
          {!prof && (
            <div className="rounded-xl bg-[#F4F5F7] p-4 space-y-3">
              <p className="text-xs text-charcoal/60">Acesso ao painel (opcional): o profissional verá apenas a própria agenda e os próprios prontuários.</p>
              <div className="grid grid-cols-2 gap-3">
                <F label="Email de login"><Input type="email" value={f.email} onChange={set("email")} data-testid="prof-email-input" /></F>
                <F label="Senha"><Input type="password" value={f.password} onChange={set("password")} data-testid="prof-password-input" /></F>
              </div>
            </div>
          )}
          <button onClick={save} className="w-full h-11 rounded-full bg-moss text-cream font-medium" data-testid="prof-save-button">Salvar</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ServiceDialog = ({ svc, onClose, onSaved }) => {
  const [f, setF] = useState({ name: svc?.name || "", category: svc?.category || "personal", description: svc?.description || "" });
  const save = async () => {
    try {
      if (svc) await api.put(`/admin/services/${svc.id}`, f); else await api.post("/admin/services", f);
      toast.success("Serviço salvo");
      onSaved();
      onClose();
    } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="service-dialog">
        <DialogHeader><DialogTitle className="font-display">{svc ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <F label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-testid="service-name-input" /></F>
          <F label="Área">
            <div className="flex gap-2">{[["personal", "Personal Training"], ["fisio", "Fisioterapia"]].map(([k, l]) => (
              <button key={k} onClick={() => setF({ ...f, category: k })} data-testid={`service-cat-${k}`} className={`flex-1 h-10 rounded-full border text-sm ${f.category === k ? "bg-moss text-cream border-moss" : ""}`}>{l}</button>
            ))}</div>
          </F>
          <F label="Descrição"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} data-testid="service-description-input" /></F>
          <button onClick={save} className="w-full h-11 rounded-full bg-moss text-cream font-medium" data-testid="service-save-button">Salvar</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
