import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const FullLoader = () => (
  <div className="min-h-screen grid place-items-center" data-testid="page-loader">
    <Loader2 className="w-6 h-6 animate-spin text-moss" />
  </div>
);

export const RequireAuth = ({ roles, children }) => {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === null) return <FullLoader />;
  if (!user) return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center" data-testid="access-denied">
        <div className="space-y-4">
          <p className="eyebrow">Acesso restrito</p>
          <h1 className="text-3xl font-semibold">Esta área não está disponível para a sua conta.</h1>
          <Link to="/" className="text-moss underline underline-offset-4" data-testid="access-denied-home-link">Voltar ao início</Link>
        </div>
      </div>
    );
  }
  return children;
};
