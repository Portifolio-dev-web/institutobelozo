import { fmtDate } from "@/lib/format";

const cellColor = (r) => (r === null ? "bg-charcoal/5" : r >= 0.85 ? "bg-moss" : r >= 0.5 ? "bg-moss/60" : r > 0 ? "bg-moss/30" : "bg-gold/25");

export const Occupancy = ({ rows }) => {
  const total = rows.reduce((s, r) => s + r.days.reduce((x, d) => x + d.total, 0), 0);
  const booked = rows.reduce((s, r) => s + r.days.reduce((x, d) => x + Math.min(d.booked, d.total), 0), 0);
  const pct = total ? Math.round((booked / total) * 100) : 0;
  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6" data-testid="admin-occupancy">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div><p className="eyebrow">Ocupação de vagas</p><p className="mt-2 text-3xl font-display font-semibold" data-testid="admin-occupancy-pct">{pct}%</p></div>
        <div className="flex gap-4 text-xs text-charcoal/60">
          <span data-testid="admin-occupancy-booked"><b className="text-charcoal">{booked}</b> ocupados</span>
          <span data-testid="admin-occupancy-free"><b className="text-charcoal">{Math.max(total - booked, 0)}</b> livres</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs w-full min-w-[480px]">
          <thead><tr><th className="text-left font-normal text-charcoal/50 pb-2">Profissional</th>{rows[0]?.days.map((d) => <th key={d.date} className="font-normal text-charcoal/50 pb-2">{rows[0].days.length > 1 ? fmtDate(d.date, { weekday: "short" }) : fmtDate(d.date)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.professional_id}>
                <td className="py-1 pr-3 whitespace-nowrap">{r.name}</td>
                {r.days.map((d) => (
                  <td key={d.date} className="p-1">
                    <div title={`${d.booked}/${d.total}`} className={`h-8 rounded-md grid place-items-center ${cellColor(d.total ? d.booked / d.total : null)} ${d.total && d.booked / d.total >= 0.5 ? "text-cream" : "text-charcoal/60"}`}>
                      {d.total ? `${d.booked}/${d.total}` : "–"}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
