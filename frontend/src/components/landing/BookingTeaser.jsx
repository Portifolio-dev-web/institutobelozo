import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

const STEPS = [["01", "Escolha o serviço"], ["02", "Escolha o profissional"], ["03", "Escolha um horário livre"]];

export const BookingTeaser = () => {
  const [services, setServices] = useState([]);
  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => setServices([]));
  }, []);
  return (
    <section id="agendamento" className="py-24 lg:py-40" data-testid="booking-teaser-section">
      <div className="container-x grid lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5 space-y-8">
          <Reveal><p className="eyebrow">Agendamento online</p></Reveal>
          <Reveal delay={0.1}><h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Três passos até a sua primeira sessão.</h2></Reveal>
          <Reveal delay={0.2}>
            <Link to="/agendar" data-testid="booking-teaser-cta" className="group inline-flex items-center gap-3 rounded-full bg-moss px-8 py-4 text-cream font-medium hover:bg-moss-dark transition-colors">
              Agende sua Avaliação <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
        <div className="lg:col-span-7 space-y-10">
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map(([n, t], i) => (
              <Reveal key={n} delay={0.1 * i}>
                <div className="rounded-2xl border bg-white/60 p-6 h-full"><p className="font-serif italic text-3xl text-gold">{n}</p><p className="mt-6 font-medium">{t}</p></div>
              </Reveal>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {services.map((s) => (
              <Link key={s.id} to={`/agendar?service=${s.id}`} data-testid={`booking-teaser-service-${s.id}`}
                className="rounded-full border border-moss/20 px-5 py-2.5 text-sm hover:border-moss hover:bg-moss hover:text-cream transition-colors">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
