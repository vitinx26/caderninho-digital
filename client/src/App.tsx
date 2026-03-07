/**
 * App.tsx - Componente raiz do Caderninho Digital
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NavigationProvider, useNavigation } from "./contexts/NavigationContext";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ClientePerfil from "./pages/ClientePerfil";
import NovoLancamento from "./pages/NovoLancamento";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import ErrorBoundary from "./components/ErrorBoundary";

function RouterContent() {
  const { paginaAtual } = useNavigation();

  return (
    <Layout>
      {paginaAtual === 'dashboard' && <Dashboard />}
      {paginaAtual === 'cliente' && <ClientePerfil />}
      {paginaAtual === 'novo-lancamento' && <NovoLancamento />}
      {paginaAtual === 'relatorios' && <Relatorios />}
      {paginaAtual === 'configuracoes' && <Configuracoes />}
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <NavigationProvider>
            <RouterContent />
          </NavigationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
