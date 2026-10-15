import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal, MediaTag } from "@/components/Reveal";

const IMGS = [
  "https://images.unsplash.com/photo-1637430308606-86576d8fef3c?crop=entropy&cs=srgb&fm=jpg&q=80&w=1400",
  "https://images.unsplash.com/photo-1685633224860-7655234d9cd5?crop=entropy&cs=srgb&fm=jpg&q=80&w=1000",
  "https://images.unsplash.com/photo-1771270786606-f5a0e57db762?crop=entropy&cs=srgb&fm=jpg&q=80&w=1000",
];

const ParallaxImg = ({ src, progress, range, className, testId }) => {
  const y = useTransform(progress, [0, 1], range);
  return (
    <div className={`relative overflow-hidden rounded-[2rem] ${className}`} data-testid={testId}>
      <motion.img style={{ y }} src={src} alt="Estrutura do instituto" className="absolute inset-0 h-[125%] w-full object-cover -top-[12%]" />
      <MediaTag label="Foto da estrutura · placeholder" />
    </div>
  );
};

export const Gallery = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return (
    <section id="estrutura" ref={ref} className="py-24 lg:py-40" data-testid="gallery-section">
      <div className="container-x">
        <div className="mb-16 max-w-2xl space-y-6">
          <Reveal><p className="eyebrow">Nossa estrutura</p></Reveal>
          <Reveal delay={0.1}><h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">Um espaço que convida a <span className="font-serif italic font-medium text-moss">voltar</span>.</h2></Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <ParallaxImg src={IMGS[0]} progress={scrollYProgress} range={["-6%", "6%"]} className="md:col-span-7 aspect-[4/3] md:aspect-auto md:h-[640px]" testId="gallery-image-1" />
          <div className="md:col-span-5 grid gap-6">
            <ParallaxImg src={IMGS[1]} progress={scrollYProgress} range={["-12%", "10%"]} className="aspect-[4/3] md:aspect-auto md:h-[308px]" testId="gallery-image-2" />
            <ParallaxImg src={IMGS[2]} progress={scrollYProgress} range={["10%", "-10%"]} className="aspect-[4/3] md:aspect-auto md:h-[308px]" testId="gallery-image-3" />
          </div>
        </div>
      </div>
    </section>
  );
};
