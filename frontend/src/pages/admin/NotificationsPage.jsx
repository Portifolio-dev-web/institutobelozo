import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Mail, Send, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";

const KINDS = { confirmacao: "Confirmação", cancelamento: "Cancelamento", reagendamento: "Reagendamento", resumo_diario: "Resumo diário", cancelamento_cliente: "Cancelado pelo cliente" };

export default function NotificationsPage() {
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get("/admin/notifications").then((r) => setList(r.data)), []);
  useEffect(() => { load(); }, [load]);
  const trigger = async () => {
    setBusy(true);
    try { const r = await api.post("/admin/daily-summary"); toast.success(`${r.data.length} resumo(s) gerado(s)`); load(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-8 max-w-4xl" data-testid="admin-notifications-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div><p className="eyebrow">Mensagens</p><h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Notificações</h1></div>
        <button onClick={trigger} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-moss text-cream px-6 h-11 text-sm disabled:opacity-50" data-testid="notifications-trigger-summary-button">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Disparar Resumo Diário agora
        </button>
      </div>
      <div className="flex gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm" data-testid="notifications-simulated-banner">
        <Info className="w-5 h-5 text-[#8a6a2a] shrink-0" />
        <p><b>Modo simulado:</b> nenhuma mensagem é enviada de verdade. Tudo fica registrado aqui. O Resumo Diário é gerado automaticamente às 07h (Brasília). Para enviar de verdade, conecte Evolution API, Z-API ou Twilio.</p>
      </div>
      <div className="space-y-3">
        {list.map((n) => (
          <div key={n.id} className="rounded-2xl border bg-white p-5" data-testid={`notification-${n.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-charcoal/55">
              <span className="inline-flex items-center gap-2">
                {n.channel === "whatsapp" ? <MessageCircle className="w-4 h-4 text-moss" /> : <Mail className="w-4 h-4 text-terra" />}
                <b className="text-charcoal font-medium">{KINDS[n.kind] || n.kind}</b> · para {n.recipient_name} ({n.to || "sem contato"})
              </span>
              <span>{fmtDateTime(n.created_at)} · <span className="uppercase tracking-wider">{n.status}</span></span>
            </div>
            <p className={`mt-3 text-sm rounded-xl px-4 py-3 w-fit max-w-full ${n.channel === "whatsapp" ? "bg-[#E7F0EA]" : "bg-[#F2F1EC]"}`}>{n.message}</p>
          </div>
        ))}
        {!list.length && <p className="text-charcoal/55" data-testid="notifications-empty">Nenhuma notificação ainda.</p>}
      </div>
    </div>
  );
}
