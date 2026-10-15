import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth, isStaff } from "@/context/AuthContext";

const LINKS = [["#sobre", "Sobre"], ["#servicos", "Serviços"], ["#estrutura", "Estrutura"], ["#resultados", "Resultados"]];

const AccountLink = ({ user, className }) => {
  if (!user) return <Link to="/entrar" className={className} data-testid="nav-login-link">Entrar</Link>;
  const to = isStaff(user) ? "/admin" : "/minha-area";
  return <Link to={to} className={className} data-testid="nav-account-link">{isStaff(user) ? "Painel" : "Minha área"}</Link>;
};

export const Navbar = () => {
  const { user } = useAuth();
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  const tone = solid ? "text-charcoal" : "text-cream";
  return (
    <header data-testid="site-navbar" className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-500 ${solid ? "bg-cream/85 backdrop-blur-xl shadow-[0_1px_0_rgba(45,28,76,0.12)] py-3" : "py-6"}`}>
      <div className="container-x flex items-center justify-between gap-6">
        <Link to="/" className={`flex items-baseline gap-2 ${tone}`} data-testid="nav-logo">
          <span className="font-display text-lg font-semibold tracking-tight">Instituto</span>
          <span className="font-serif italic text-xl text-gold">Belozo</span>
        </Link>
        <nav className={`hidden md:flex items-center gap-9 text-sm ${tone}`}>
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="opacity-80 hover:opacity-100 transition-opacity" data-testid={`nav-link-${href.slice(1)}`}>{label}</a>
          ))}
          <AccountLink user={user} className="opacity-80 hover:opacity-100 transition-opacity" />
          <Link to="/agendar" data-testid="nav-agendar-link" className="group inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-charcoal font-medium hover:bg-[#5EE8E9] transition-colors">
            Agendar avaliação <ArrowUpRight className="w-4 h-4 transition-transform group-hover:rotate-45" />
          </Link>
        </nav>
        <Sheet>
          <SheetTrigger className={`md:hidden ${tone}`} data-testid="nav-mobile-menu-button"><Menu /></SheetTrigger>
          <SheetContent className="bg-cream">
            <SheetTitle className="font-serif italic text-2xl text-moss">Belozo</SheetTitle>
            <div className="mt-10 flex flex-col gap-6 text-lg">
              {LINKS.map(([href, label]) => <a key={href} href={href} data-testid={`mobile-nav-${href.slice(1)}`}>{label}</a>)}
              <AccountLink user={user} />
              <Link to="/agendar" className="rounded-full bg-moss text-cream text-center py-3" data-testid="mobile-nav-agendar">Agendar avaliação</Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
