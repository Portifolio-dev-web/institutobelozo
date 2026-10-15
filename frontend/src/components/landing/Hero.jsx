import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const HERO_VIDEO = "/media/equipe-belozo.mp4";
const HERO_POSTER = "https://images.unsplash.com/photo-1637430308606-86576d8fef3c?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600";

const up = (d) => ({ initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, delay: d, ease: [0.22, 1, 0.36, 1] } });

export const Hero = () => (
  <section className="relative min-h-[100svh] overflow-hidden bg-charcoal grain" data-testid="hero-section">
    <video className="absolute inset-0 h-full w-full object-cover" src={HERO_VIDEO} poster={HERO_POSTER} autoPlay muted loop playsInline data-testid="hero-video" />
    <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/45 to-charcoal/85" />
    <div className="relative z-10 container-x flex min-h-[100svh] flex-col justify-end pb-20 lg:pb-28 pt-40">
      <motion.p {...up(0.1)} className="eyebrow text-gold">Personal Training · Fisioterapia</motion.p>
      <motion.h1 {...up(0.25)} className="mt-6 max-w-4xl text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-semibold tracking-tight leading-[1.05] text-cream">
        Seu corpo em <span className="font-serif italic font-medium text-gold">transformação</span>, sua saúde em primeiro lugar.
      </motion.h1>
      <motion.p {...up(0.4)} className="mt-8 max-w-xl text-base sm:text-lg leading-relaxed text-cream/75">
        Treino individual e reabilitação com acompanhamento próximo, em um espaço pensado para você evoluir com segurança.
      </motion.p>
      <motion.div {...up(0.55)} className="mt-12 flex flex-col sm:flex-row gap-4 sm:items-center">
        <Link to="/agendar" data-testid="hero-cta-button" className="group inline-flex items-center justify-center gap-3 rounded-full bg-gold px-8 py-4 text-base font-semibold text-charcoal shadow-[0_20px_60px_-15px_rgba(54,223,224,0.6)] hover:bg-[#5EE8E9] active:scale-[0.98] transition-[background-color,transform]">
          Agende sua Avaliação <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <a href="#servicos" className="text-sm text-cream/80 hover:text-cream underline-offset-8 hover:underline" data-testid="hero-services-link">Conheça os serviços</a>
      </motion.div>
    </div>
  </section>
);
