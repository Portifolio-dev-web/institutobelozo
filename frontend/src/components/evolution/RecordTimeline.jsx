import { Trash2 } from "lucide-react";
import { fmtLong } from "@/lib/format";

const Metric = ({ label, value }) =>
  value || value === 0 ? (
    <span className="rounded-full bg-[#EFEDE6] px-3 py-1 text-xs"><span className="text-charcoal/50">{label}</span> <b className="font-medium">{value}</b></span>
  ) : null;

export const RecordTimeline = ({ records, onDelete }) => {
  if (!records.length) return <p className="text-charcoal/55 text-sm" data-testid="records-empty">Nenhum registro de evolução ainda.</p>;
  return (
    <ol className="relative border-l border-moss/20 ml-2 space-y-8" data-testid="records-timeline">
      {records.map((r) => (
        <li key={r.id} className="pl-8 relative" data-testid={`record-item-${r.id}`}>
          <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-gold ring-4 ring-cream" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display font-semibold first-letter:uppercase">{fmtLong(r.date)}</p>
              <p className="text-xs text-charcoal/50">por {r.professional_name}</p>
            </div>
            {onDelete && <button onClick={() => onDelete(r)} className="text-charcoal/40 hover:text-charcoal" data-testid={`record-delete-${r.id}`}><Trash2 className="w-4 h-4" /></button>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Metric label="Peso" value={r.weight != null ? `${r.weight} kg` : null} />
            <Metric label="Dor" value={r.pain != null ? `${r.pain}/10` : null} />
            <Metric label="Mobilidade" value={r.mobility} />
          </div>
          {r.notes && <p className="mt-3 text-sm text-charcoal/75 whitespace-pre-line">{r.notes}</p>}
          {r.exercises?.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="text-sm min-w-[320px]">
                <thead><tr className="text-left text-xs text-charcoal/50"><th className="pr-6 font-normal">Exercício</th><th className="pr-4 font-normal">Séries</th><th className="pr-4 font-normal">Reps</th><th className="font-normal">Carga</th></tr></thead>
                <tbody>{r.exercises.map((e, i) => <tr key={i}><td className="pr-6 py-0.5">{e.name}</td><td>{e.sets ?? "-"}</td><td>{e.reps ?? "-"}</td><td>{e.load != null ? `${e.load} kg` : "-"}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {r.recovery_notes && <p className="mt-3 text-sm border-l-2 border-terra/50 pl-3 text-charcoal/70"><span className="text-terra text-xs uppercase tracking-wider block">Recuperação</span>{r.recovery_notes}</p>}
        </li>
      ))}
    </ol>
  );
};
