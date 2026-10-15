import { AppointmentCard } from "@/components/admin/AppointmentCard";
import { daySlots, fmtDate, addDays, STATUS } from "@/lib/format";

export const DayView = ({ date, appts, profs, onChanged }) => (
  <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3" data-testid="agenda-day-view">
    {profs.map((p) => {
      const mine = appts.filter((a) => a.professional_id === p.id);
      const active = Object.fromEntries(mine.filter((a) => a.active).map((a) => [a.time, a]));
      const times = [...new Set([...daySlots(p, date), ...Object.keys(active)])].sort();
      const cancelled = mine.filter((a) => !a.active);
      return (
        <div key={p.id} className="rounded-2xl bg-white/70 border p-4 space-y-3" data-testid={`day-col-${p.id}`}>
          <div className="flex justify-between items-baseline"><p className="font-display font-semibold">{p.name}</p><p className="text-xs text-charcoal/50">{Object.keys(active).length}/{daySlots(p, date).length} ocupados</p></div>
          {times.length === 0 && <p className="text-sm text-charcoal/50">Sem expediente neste dia.</p>}
          {times.map((t) => active[t] ? <AppointmentCard key={t} a={active[t]} onChanged={onChanged} /> : (
            <div key={t} className="flex items-center justify-between rounded-xl border border-dashed border-moss/25 px-4 py-2.5 text-sm text-charcoal/45" data-testid={`free-slot-${p.id}-${t.replace(":", "")}`}>
              <span>{t}</span><span className="text-xs uppercase tracking-wider text-moss/60">Livre</span>
            </div>
          ))}
          {cancelled.length > 0 && <details className="text-sm"><summary className="cursor-pointer text-charcoal/50">{cancelled.length} cancelado(s)</summary><div className="mt-2 space-y-2">{cancelled.map((a) => <AppointmentCard key={a.id} a={a} onChanged={onChanged} />)}</div></details>}
        </div>
      );
    })}
  </div>
);

export const WeekView = ({ start, appts, occupancy, onChanged }) => (
  <div className="overflow-x-auto -mx-5 px-5" data-testid="agenda-week-view">
    <div className="grid grid-cols-7 gap-3 min-w-[1100px]">
      {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => {
        const list = appts.filter((a) => a.date === d && a.active);
        const total = occupancy.reduce((s, r) => s + (r.days.find((x) => x.date === d)?.total || 0), 0);
        const booked = occupancy.reduce((s, r) => s + (r.days.find((x) => x.date === d)?.booked || 0), 0);
        return (
          <div key={d} className="rounded-2xl bg-white/70 border p-3 space-y-3" data-testid={`week-col-${d}`}>
            <div>
              <p className="text-xs uppercase tracking-wider text-charcoal/50">{fmtDate(d, { weekday: "short" })}</p>
              <p className="font-display font-semibold">{fmtDate(d)}</p>
              <div className="mt-2 h-1.5 rounded-full bg-moss/10 overflow-hidden"><div className="h-full bg-moss" style={{ width: `${total ? (booked / total) * 100 : 0}%` }} /></div>
              <p className="mt-1 text-[11px] text-charcoal/50">{booked} ocupados · {Math.max(total - booked, 0)} livres</p>
            </div>
            {list.map((a) => <AppointmentCard key={a.id} a={a} onChanged={onChanged} />)}
          </div>
        );
      })}
    </div>
  </div>
);

export const KanbanView = ({ appts, onChanged }) => (
  <div className="grid gap-5 lg:grid-cols-3" data-testid="agenda-kanban-view">
    {["pending", "confirmed", "cancelled"].map((s) => {
      const list = appts.filter((a) => a.status === s);
      return (
        <div key={s} className="rounded-2xl bg-white/60 border p-4 space-y-3" data-testid={`kanban-col-${s}`}>
          <div className="flex justify-between"><p className="font-display font-semibold">{STATUS[s].label}</p><span className="text-xs rounded-full bg-charcoal/5 px-2 py-0.5">{list.length}</span></div>
          {list.map((a) => <AppointmentCard key={a.id} a={a} onChanged={onChanged} showDate />)}
          {!list.length && <p className="text-sm text-charcoal/40">Nada por aqui.</p>}
        </div>
      );
    })}
  </div>
);
