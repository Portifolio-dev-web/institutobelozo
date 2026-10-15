import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 32, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const MediaTag = ({ label = "Placeholder · substituir pela mídia real" }) => (
  <span className="absolute left-4 bottom-4 z-10 rounded-full bg-charcoal/60 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cream/90" data-testid="media-placeholder-tag">
    {label}
  </span>
);
