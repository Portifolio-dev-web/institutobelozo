import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const Option = ({ testId, title, sub, initials, onClick, featured }) => (
  <button onClick={onClick} data-testid={testId}
    className={`flex items-center gap-5 text-left rounded-2xl border p-6 hover:border-moss hover:-translate-y-1 transition-[transform,border-color] ${featured ? "bg-moss text-cream border-moss" : "bg-white"}`}>
    <span className={`grid place-items-center w-14 h-14 rounded-full shrink-0 font-display font-semibold ${featured ? "bg-cream/10" : "bg-[#ECEDF1] text-moss"}`}>
      {initials || <Users className="w-6 h-6" />}
    </span>
    <span>
      <span className="block font-display font-semibold text-lg">{title}</span>
      <span className={`block text-sm mt-1 ${featured ? "text-cream/70" : "text-charcoal/55"}`}>{sub}</span>
    </span>
  </button>
);

export const StepProfessional = ({ serviceId, onPick }) => {
  const [pros, setPros] = useState(null);
  useEffect(() => {
    api.get("/professionals", { params: { service_id: serviceId } }).then((r) => setPros(r.data));
  }, [serviceId]);
  if (!pros) return <Loader2 className="w-6 h-6 animate-spin text-moss" />;
  return (
    <div className="grid sm:grid-cols-2 gap-4" data-testid="wizard-step-2-prof">
      <Option featured testId="wizard-prof-option-any" title="Qualquer profissional" sub="Mostramos todos os horários e alocamos o primeiro livre" onClick={() => onPick("any", "Qualquer profissional")} />
      {pros.map((p) => (
        <Option key={p.id} testId={`wizard-prof-option-${p.id}`} title={p.name} sub={p.specialty}
          initials={p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} onClick={() => onPick(p.id, p.name)} />
      ))}
      {!pros.length && <p className="text-charcoal/60 sm:col-span-2" data-testid="wizard-no-pros">Ainda não há profissionais para este serviço.</p>}
    </div>
  );
};
