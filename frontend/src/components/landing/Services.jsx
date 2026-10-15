import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, HeartPulse, ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const CARDS = [
  { key: "personal", title: "Personal Training", Icon: Dumbbell, accent: "text-gold",
    img: "https://images.unsplash.com/photo-1771270786606-f5a0e57db762?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
    text: "Treino individual, planejado para o seu objetivo: força, condicionamento, emagrecimento ou performance.",
    items: ["Avaliação física inicial", "Progressão de cargas registrada", "Acompanhamento sessão a sessão"] },
  { key: "fisio", title: "Fisioterapia", Icon: HeartPulse, accent: "text-terra",
    img: "https://images.unsplash.com/photo-1645005513713-9e2b92a687d3?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
    text: "Reabilitação, alívio de dor e prevenção de lesões com um plano construído a partir da sua avaliação.",
    items: ["Avaliação fisioterapêutica", "Controle de dor e mobilidade", "Evolução registrada no prontuário"] },
];

const ServiceCard = ({ c, i }) => (
  <Reveal delay={i * 0.15}>
    <motion.div whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="group relative overflow-hidden rounded-[2rem] bg-charcoal min-h-[520px] lg:min-h-[620px] flex flex-col justify-end p-8 sm:p-12" data-testid={`service-card-${c.key}`}>
      <img src={c.img} alt={c.title} className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:opacity-35 group-hover:scale-105 transition-[opacity,transform] duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
      <div className="relative z-10 text-cream space-y-6">
        <c.Icon className={`w-9 h-9 ${c.accent}`} strokeWidth={1.4} />
        <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight">{c.title}</h3>
        <p className="max-w-md text-cream/75 leading-relaxed">{c.text}</p>
        <ul className="space-y-2 max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 lg:transition-[max-height,opacity] duration-500 max-lg:max-h-40 max-lg:opacity-100">
          {c.items.map((it) => <li key={it} className="flex gap-3 text-sm text-cream/85"><Check className={`w-4 h-4 mt-0.5 ${c.accent}`} />{it}</li>)}
        </ul>
        <Link to={`/agendar?cat=${c.key}`} data-testid={`service-card-${c.key}-cta`} className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 text-sm hover:bg-cream hover:text-charcoal transition-colors">
          Agendar este serviço <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  </Reveal>
);

export const Services = () => (
  <section id="servicos" className="py-24 lg:py-36 bg-[#EFEDE6]" data-testid="services-section">
    <div className="container-x">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
        <div className="space-y-6">
          <Reveal><p className="eyebrow">Nossos serviços</p></Reveal>
          <Reveal delay={0.1}><h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight max-w-2xl">Duas frentes, um mesmo cuidado.</h2></Reveal>
        </div>
        <Reveal delay={0.2}><p className="max-w-sm text-charcoal/60">Passe o cursor sobre cada área para ver o que está incluído.</p></Reveal>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {CARDS.map((c, i) => <ServiceCard key={c.key} c={c} i={i} />)}
      </div>
    </div>
  </section>
);
