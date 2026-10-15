import { Reveal, MediaTag } from "@/components/Reveal";

const IMG_A = "https://images.unsplash.com/photo-1645005513709-77336f075dc8?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200";
const IMG_B = "https://images.unsplash.com/photo-1706353399656-210cca727a33?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200";

export const About = () => (
  <section id="sobre" className="py-24 lg:py-40" data-testid="about-section">
    <div className="container-x grid gap-16 lg:grid-cols-12 lg:gap-20 items-center">
      <div className="lg:col-span-5 space-y-8">
        <Reveal><p className="eyebrow">Sobre nós</p></Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
            Movimento com <span className="font-serif italic font-medium text-moss">propósito</span> e cuidado individual.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-base sm:text-lg leading-relaxed text-charcoal/70">
            O Instituto Belozo une Personal Training e Fisioterapia em um só lugar. Cada aluno e paciente começa por uma avaliação,
            recebe um plano próprio e tem a evolução registrada sessão a sessão.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="text-sm text-charcoal/50" data-testid="about-placeholder-note">[Texto de exemplo — substitua pela história do instituto.]</p>
        </Reveal>
      </div>
      <div className="lg:col-span-7 grid grid-cols-5 gap-4 sm:gap-6">
        <Reveal className="col-span-3 relative overflow-hidden rounded-[2rem] aspect-[3/4]" y={60}>
          <img src={IMG_A} alt="Sessão de treino" className="h-full w-full object-cover hover:scale-105 transition-transform duration-[1.5s]" data-testid="about-image-1" />
          <MediaTag />
        </Reveal>
        <Reveal className="col-span-2 relative mt-24 overflow-hidden rounded-[2rem] aspect-[3/4]" delay={0.2} y={90}>
          <img src={IMG_B} alt="Atendimento de fisioterapia" className="h-full w-full object-cover hover:scale-105 transition-transform duration-[1.5s]" data-testid="about-image-2" />
        </Reveal>
      </div>
    </div>
  </section>
);
