/**
 * App.tsx - Componente raiz do Caderninho Digital
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AdminPerfil from "./pages/AdminPerfil";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se não está logado, mostrar login
  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Se está logado, mostrar aplicativo
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin/perfil" component={AdminPerfil} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
