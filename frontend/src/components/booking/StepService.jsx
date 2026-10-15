import { Dumbbell, HeartPulse, ArrowRight } from "lucide-react";

const CATS = [["personal", "Personal Training", Dumbbell, "text-gold"], ["fisio", "Fisioterapia", HeartPulse, "text-terra"]];

export const StepService = ({ services, highlight, onPick }) => (
  <div className="space-y-12" data-testid="wizard-step-1-service">
    {CATS.map(([cat, label, Icon, color]) => {
      const list = services.filter((s) => s.category === cat);
      if (!list.length) return null;
      return (
        <div key={cat}>
          <p className={`flex items-center gap-2 mb-5 font-display font-medium ${highlight === cat ? "text-moss" : ""}`}><Icon className={`w-5 h-5 ${color}`} /> {label}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {list.map((s) => (
              <button key={s.id} onClick={() => onPick(s)} data-testid={`wizard-service-option-${s.id}`}
                className={`group text-left rounded-2xl border bg-white p-6 sm:p-8 hover:border-moss hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(45,74,62,0.45)] transition-[transform,box-shadow,border-color] ${highlight === cat ? "border-moss/40" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-lg font-display font-semibold">{s.name}</p>
                  <ArrowRight className="w-5 h-5 text-moss opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform]" />
                </div>
                <p className="mt-3 text-sm text-charcoal/60 leading-relaxed">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);
