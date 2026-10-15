import { ClipboardCheck, LineChart, UserCheck } from "lucide-react";
import { Reveal, MediaTag } from "@/components/Reveal";

const VIDEO = "https://assets.mixkit.co/videos/41486/41486-720.mp4";
const ITEMS = [
  { Icon: ClipboardCheck, title: "Avaliação antes de tudo", text: "Todo plano nasce de uma avaliação individual." },
  { Icon: UserCheck, title: "Atendimento individual", text: "Seu profissional acompanha cada repetição e cada ajuste." },
  { Icon: LineChart, title: "Evolução visível", text: "Cargas, dor e mobilidade registradas para você acompanhar online." },
];

export const Results = () => (
  <section id="resultados" className="relative overflow-hidden bg-moss-dark text-cream grain" data-testid="results-section">
    <video className="absolute inset-0 h-full w-full object-cover opacity-30" src={VIDEO} autoPlay muted loop playsInline data-testid="results-video" />
    <div className="absolute inset-0 bg-gradient-to-r from-moss-dark via-moss-dark/80 to-moss-dark/40" />
    <MediaTag label="Vídeo de resultados · placeholder" />
    <div className="relative z-10 container-x py-28 lg:py-44 grid lg:grid-cols-2 gap-16 items-end">
      <div className="space-y-8">
        <Reveal><p className="eyebrow text-gold">Resultados</p></Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
            Resultado é o que se <span className="font-serif italic font-medium text-gold">sustenta</span> no tempo.
          </h2>
        </Reveal>
        <Reveal delay={0.2}><p className="max-w-lg text-cream/70 leading-relaxed">Método, constância e registro. É assim que cada aluno e paciente enxerga a própria transformação.</p></Reveal>
      </div>
      <div className="grid gap-4">
        {ITEMS.map(({ Icon, title, text }, i) => (
          <Reveal key={title} delay={0.15 * i}>
            <div className="flex gap-5 rounded-2xl border border-cream/10 bg-cream/5 backdrop-blur-xl p-6 hover:bg-cream/10 transition-colors" data-testid={`results-item-${i}`}>
              <Icon className="w-6 h-6 text-gold shrink-0" strokeWidth={1.5} />
              <div><p className="font-display font-medium">{title}</p><p className="text-sm text-cream/60 mt-1">{text}</p></div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
