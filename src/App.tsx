
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "./pages/Home";
import CodeValidation from "./pages/CodeValidation";
import FeedbackForm from "./pages/FeedbackForm";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AtendimentosDashboard from "./pages/admin/AtendimentosDashboard";
import Feedbacks from "./pages/admin/Feedbacks";
import Attendants from "./pages/admin/Attendants";
import Management from "./pages/admin/Management";
import Settings from "./pages/admin/Settings";
import Monitor from "./pages/admin/Monitor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/validacao" element={<CodeValidation />} />
            <Route path="/feedback" element={<FeedbackForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="atendimentos" element={<AtendimentosDashboard />} />
              <Route path="feedbacks" element={<Feedbacks />} />
              <Route path="attendants" element={<Attendants />} />
              <Route path="management" element={<Management />} />
              <Route path="settings" element={<Settings />} />
              <Route path="monitor" element={<Monitor />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
