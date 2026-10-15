import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="bg-charcoal text-cream/70" data-testid="site-footer">
    <div className="container-x py-20 grid gap-12 md:grid-cols-3">
      <div>
        <p className="flex items-baseline gap-2 text-cream"><span className="font-display text-xl font-semibold">Instituto</span><span className="font-serif italic text-2xl text-gold">Belozo</span></p>
        <p className="mt-4 text-sm max-w-xs">Personal Training e Fisioterapia.</p>
      </div>
      <div className="text-sm space-y-2">
        <p className="eyebrow text-gold mb-4">Contato</p>
        <p data-testid="footer-address">[Endereço do instituto]</p>
        <p data-testid="footer-whatsapp">[WhatsApp do instituto]</p>
        <p data-testid="footer-instagram">[@ do Instagram]</p>
      </div>
      <div className="text-sm space-y-2">
        <p className="eyebrow text-gold mb-4">Acesso</p>
        <Link to="/agendar" className="block hover:text-cream" data-testid="footer-agendar-link">Agendar avaliação</Link>
        <Link to="/minha-area" className="block hover:text-cream" data-testid="footer-client-link">Minha área</Link>
        <Link to="/admin" className="block hover:text-cream" data-testid="footer-admin-link">Área da equipe</Link>
      </div>
    </div>
    <div className="container-x py-6 border-t border-cream/10 text-xs">© 2026 Instituto Belozo</div>
  </footer>
);
