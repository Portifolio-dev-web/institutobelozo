import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import BookingPage from "@/pages/BookingPage";
import ClientArea from "@/pages/ClientArea";
import AdminLayout from "@/pages/admin/AdminLayout";
import AgendaPage from "@/pages/admin/AgendaPage";
import ClientsPage from "@/pages/admin/ClientsPage";
import ClientDetailPage from "@/pages/admin/ClientDetailPage";
import SchedulePage from "@/pages/admin/SchedulePage";
import TeamPage from "@/pages/admin/TeamPage";
import NotificationsPage from "@/pages/admin/NotificationsPage";

const STAFF = ["admin", "professional"];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={<AuthPage />} />
          <Route path="/agendar" element={<RequireAuth roles={["client"]}><BookingPage /></RequireAuth>} />
          <Route path="/minha-area" element={<RequireAuth roles={["client"]}><ClientArea /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth roles={STAFF}><AdminLayout /></RequireAuth>}>
            <Route index element={<AgendaPage />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="clientes/:clientId" element={<ClientDetailPage />} />
            <Route path="grade" element={<SchedulePage />} />
            <Route path="equipe" element={<RequireAuth roles={["admin"]}><TeamPage /></RequireAuth>} />
            <Route path="notificacoes" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors toastOptions={{ style: { fontFamily: "DM Sans" } }} />
    </AuthProvider>
  );
}

export default App;
