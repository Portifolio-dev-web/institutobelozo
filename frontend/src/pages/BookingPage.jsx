import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { SimpleHeader } from "@/components/SimpleHeader";
import { StepService } from "@/components/booking/StepService";
import { StepProfessional } from "@/components/booking/StepProfessional";
import { StepDateTime } from "@/components/booking/StepDateTime";
import { fmtLong } from "@/lib/format";

const LABELS = ["Serviço", "Profissional", "Data e horário"];

const Stepper = ({ step }) => (
  <ol className="flex gap-2 sm:gap-6 mb-14" data-testid="wizard-stepper">
    {LABELS.map((l, i) => (
      <li key={l} className="flex-1">
        <div className={`h-[3px] rounded-full transition-colors duration-500 ${i <= step ? "bg-moss" : "bg-moss/15"}`} />
        <p className={`mt-3 text-xs sm:text-sm ${i === step ? "text-charcoal font-medium" : "text-charcoal/45"}`}>
          <span className="font-serif italic text-gold mr-1">0{i + 1}</span> {l}
        </p>
      </li>
    ))}
  </ol>
);

const Done = ({ appt }) => (
  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2rem] bg-white border p-10 sm:p-16 text-center space-y-6" data-testid="booking-success">
    <CheckCircle2 className="w-14 h-14 mx-auto text-moss" strokeWidth={1.3} />
    <h2 className="text-3xl font-semibold">Pedido enviado!</h2>
    <p className="text-charcoal/70 max-w-md mx-auto">
      {appt.service_name} com {appt.professional_name}, {fmtLong(appt.date)} às {appt.time}. Seu agendamento está <b>pendente</b> e você será avisado assim que for confirmado.
    </p>
    <Link to="/minha-area" className="inline-flex rounded-full bg-moss text-cream px-8 py-3.5 hover:bg-moss-dark transition-colors" data-testid="booking-success-my-area-link">Ver meus agendamentos</Link>
  </motion.div>
);

export default function BookingPage() {
  const [params] = useSearchParams();
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState({ service: null, prof: "any", profName: "Qualquer profissional" });
  const [done, setDone] = useState(null);

  useEffect(() => {
    api.get("/services").then((r) => {
      setServices(r.data);
      const pre = r.data.find((s) => s.id === params.get("service"));
      if (pre) {
        setSel((s) => ({ ...s, service: pre }));
        setStep(1);
      }
    });
  }, [params]);

  return (
    <div className="min-h-screen bg-cream" data-testid="booking-page">
      <SimpleHeader><Link to="/minha-area" className="text-charcoal/70 hover:text-charcoal" data-testid="booking-my-area-link">Minha área</Link></SimpleHeader>
      <main className="container-x max-w-5xl py-14 lg:py-20">
        {done ? <Done appt={done} /> : (
          <>
            <p className="eyebrow">Agendamento</p>
            <h1 className="mt-4 mb-12 text-4xl sm:text-5xl font-semibold tracking-tight">Agende sua <span className="font-serif italic font-medium text-moss">avaliação</span></h1>
            <Stepper step={step} />
            {step > 0 && (
              <div className="mb-8 flex flex-wrap items-center gap-3 text-sm" data-testid="wizard-summary">
                <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 text-charcoal/60 hover:text-charcoal" data-testid="wizard-back-button"><ArrowLeft className="w-4 h-4" /> Voltar</button>
                <span className="rounded-full bg-moss/10 text-moss px-3 py-1">{sel.service?.name}</span>
                {step > 1 && <span className="rounded-full bg-gold/15 text-[#0E7C7D] px-3 py-1">{sel.profName}</span>}
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                {step === 0 && <StepService services={services} highlight={params.get("cat")} onPick={(s) => { setSel({ ...sel, service: s }); setStep(1); }} />}
                {step === 1 && <StepProfessional serviceId={sel.service.id} onPick={(id, name) => { setSel({ ...sel, prof: id, profName: name }); setStep(2); }} />}
                {step === 2 && <StepDateTime service={sel.service} profId={sel.prof} onDone={setDone} />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}

