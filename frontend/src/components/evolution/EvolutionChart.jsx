import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { fmtDate } from "@/lib/format";

export const recordVolume = (r) =>
  (r.exercises || []).reduce((s, e) => s + (e.load || 0) * (e.sets || 1) * (e.reps || 1), 0);

export const EvolutionChart = ({ records }) => {
  const data = [...records].sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({
    date: fmtDate(r.date), volume: Math.round(recordVolume(r)) || null, dor: r.pain ?? null,
  }));
  if (data.length < 1) return null;
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-6" data-testid="evolution-chart">
      <p className="font-display font-medium mb-1">Evolução de carga e dor</p>
      <p className="text-xs text-charcoal/50 mb-4">Carga = soma de séries × repetições × kg dos exercícios do dia</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -10, right: 0 }}>
            <CartesianGrid stroke="#2D4A3E15" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="v" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="d" orientation="right" domain={[0, 10]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="v" type="monotone" dataKey="volume" name="Carga (kg)" stroke="#2D4A3E" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
            <Line yAxisId="d" type="monotone" dataKey="dor" name="Dor (0-10)" stroke="#C86D51" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
