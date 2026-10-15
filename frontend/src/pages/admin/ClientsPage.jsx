import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => api.get("/admin/clients", { params: { q } }).then((r) => setList(r.data)), 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="space-y-8" data-testid="admin-clients-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div><p className="eyebrow">Clientes</p><h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Clientes & Prontuários</h1></div>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou email" className="pl-10 h-11 rounded-full bg-white" data-testid="clients-search-input" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {list?.map((c) => (
          <Link key={c.id} to={`/admin/clientes/${c.id}`} data-testid={`client-row-${c.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 hover:border-moss transition-colors">
            <div>
              <p className="font-display font-semibold">{c.name}</p>
              <p className="text-xs text-charcoal/55">{c.whatsapp} · {c.email}</p>
              <p className="mt-2 text-xs text-charcoal/50">{c.appointments_count} agendamento(s) · {c.records_count} registro(s)</p>
            </div>
            <ChevronRight className="w-5 h-5 text-charcoal/30 group-hover:text-moss group-hover:translate-x-1 transition-[transform,color]" />
          </Link>
        ))}
      </div>
      {list && !list.length && <p className="text-charcoal/55" data-testid="clients-empty">Nenhum cliente encontrado.</p>}
    </div>
  );
}
