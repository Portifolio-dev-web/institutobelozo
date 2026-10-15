import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const SimpleHeader = ({ children }) => {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-xl border-b" data-testid="simple-header">
      <div className="container-x flex items-center justify-between py-4 gap-4">
        <Link to="/" className="flex items-baseline gap-2" data-testid="header-logo">
          <span className="font-display font-semibold">Instituto</span><span className="font-serif italic text-lg text-gold">Belozo</span>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {children}
          {user && (
            <button onClick={() => { logout(); nav("/"); }} className="inline-flex items-center gap-2 text-charcoal/60 hover:text-charcoal" data-testid="header-logout-button">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
