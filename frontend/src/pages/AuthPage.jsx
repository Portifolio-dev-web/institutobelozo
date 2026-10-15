import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, isStaff } from "@/context/AuthContext";
import { errMsg } from "@/lib/api";
import { maskPhone } from "@/lib/format";

const IMG = "https://images.unsplash.com/photo-1685633224860-7655234d9cd5?crop=entropy&cs=srgb&fm=jpg&q=80&w=1400";

const Field = ({ id, label, ...p }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-xs uppercase tracking-[0.15em] text-charcoal/60">{label}</Label>
    <Input id={id} className="h-12 rounded-xl bg-white" {...p} />
  </div>
);

const Submit = ({ busy, children, testId }) => (
  <button type="submit" disabled={busy} data-testid={testId} className="w-full h-12 rounded-full bg-moss text-cream font-medium hover:bg-moss-dark disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
    {busy && <Loader2 className="w-4 h-4 animate-spin" />}{children}
  </button>
);

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const next = params.get("next");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", whatsapp: "", email: "", password: "" });
  const set = (k) => (e) => setF({ ...f, [k]: k === "whatsapp" ? maskPhone(e.target.value) : e.target.value });

  const go = (u) => nav(next || (isStaff(u) ? "/admin" : "/minha-area"), { replace: true });
  useEffect(() => {
    if (user) go(user);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (fn) => async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  const doLogin = run(() => login(f.email, f.password));
  const doRegister = run(() => {
    if (f.whatsapp.replace(/\D/g, "").length < 10) throw new Error("Informe um WhatsApp válido com DDD");
    return register(f);
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-cream" data-testid="auth-page">
      <div className="relative hidden lg:block bg-charcoal">
        <img src={IMG} alt="Instituto Belozo" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
        <p className="absolute bottom-16 left-16 right-16 text-cream text-4xl font-semibold leading-tight">O primeiro passo é <span className="font-serif italic text-gold font-medium">agendar</span>.</p>
      </div>
      <div className="flex flex-col justify-center px-6 sm:px-16 xl:px-28 py-16">
        <Link to="/" className="flex items-baseline gap-2 mb-14" data-testid="auth-logo"><span className="font-display text-lg font-semibold">Instituto</span><span className="font-serif italic text-xl text-gold">Belozo</span></Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full h-12 rounded-full bg-[#ECEDF1] p-1">
              <TabsTrigger value="login" className="rounded-full" data-testid="auth-tab-login">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="rounded-full" data-testid="auth-tab-register">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={doLogin} className="space-y-5 mt-10" data-testid="auth-login-form">
                <Field id="le" label="Email" type="email" required value={f.email} onChange={set("email")} data-testid="auth-login-email-input" />
                <Field id="lp" label="Senha" type="password" required value={f.password} onChange={set("password")} data-testid="auth-login-password-input" />
                <Submit busy={busy} testId="auth-login-button">Entrar</Submit>
                <p className="text-xs text-charcoal/50 text-center">Equipe do instituto também entra por aqui.</p>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={doRegister} className="space-y-5 mt-10" data-testid="auth-register-form">
                <Field id="rn" label="Nome completo" required value={f.name} onChange={set("name")} data-testid="auth-register-name-input" />
                <Field id="rw" label="WhatsApp" required placeholder="(11) 90000-0000" value={f.whatsapp} onChange={set("whatsapp")} data-testid="auth-register-whatsapp-input" />
                <Field id="re" label="Email" type="email" required value={f.email} onChange={set("email")} data-testid="auth-register-email-input" />
                <Field id="rp" label="Senha (mín. 6 caracteres)" type="password" required minLength={6} value={f.password} onChange={set("password")} data-testid="auth-register-password-input" />
                <Submit busy={busy} testId="auth-register-button">Criar conta</Submit>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
