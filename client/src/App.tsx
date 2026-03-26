/**
 * App.tsx - Componente raiz do Caderninho Digital
 * Design: Minimalismo Funcional com Tipografia Forte
 * 
 * ✅ MIGRADO PARA: React Query (QueryClientProvider)
 * ✅ REMOVIDO: CentralizedStoreContext (SSE/Polling problemático)
 */

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NavigationProvider, useNavigation } from "./contexts/NavigationContext";
import { Layout } from './components/Layout';
import { updateVictorPassword } from './lib/updatePassword';
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientePerfil from "./pages/ClientePerfil";
import NovoLancamento from "./pages/NovoLancamento";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import ClienteView from "./pages/ClienteView";
import ContaGeral from "./pages/ContaGeral";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import GerenciarCardapios from "./pages/GerenciarCardapios";
import { ClienteLayout } from "./components/ClienteLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import UpdateNotification from "./components/UpdateNotification";
import { useUpdateCheck } from "./hooks/useUpdateCheck";

// ============================================================================
// REACT QUERY SETUP
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // Cache válido por 5s
      retry: 2, // Retry 2 vezes em erro
      refetchInterval: 10000, // Refetch a cada 10s
    },
  },
});

// ============================================================================
// ROUTER
// ============================================================================

function RouterContent() {
  const { usuarioLogado, carregando, usuarioGeral } = useAuth();
  const { paginaAtual } = useNavigation();

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se não está logado e não está usando conta geral, mostrar login
  if (!usuarioLogado && !usuarioGeral) {
    return <Login />;
  }

  // Se está usando conta geral, mostrar interface de conta geral
  if (usuarioGeral) {
    return <ContaGeral />;
  }

  // Se é admin, mostrar Dashboard e outras páginas
  if (usuarioLogado?.tipo === 'admin') {
    return (
      <Layout>
        {paginaAtual === 'dashboard' && <Dashboard />}
        {paginaAtual === 'cliente' && <ClientePerfil />}
        {paginaAtual === 'novo-lancamento' && <NovoLancamento />}
        {paginaAtual === 'relatorios' && <Relatorios />}
        {paginaAtual === 'configuracoes' && <Configuracoes />}
        {paginaAtual === 'gerenciar-usuarios' && <GerenciarUsuarios />}
        {paginaAtual === 'gerenciar-cardapios' && <GerenciarCardapios />}
      </Layout>
    );
  }

  // Se é cliente, mostrar layout com navegação
  if (usuarioLogado?.tipo === 'cliente') {
    return <ClienteLayout />;
  }

  return <Login />;
}

function AppContent() {
  const { updateAvailable, refreshApp } = useUpdateCheck();

  return (
    <>
      <RouterContent />
      <UpdateNotification updateAvailable={updateAvailable} onRefresh={refreshApp} />
    </>
  );
}

// ============================================================================
// APP
// ============================================================================

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <Toaster />
            <AuthProvider>
              <NavigationProvider>
                <AppContent />
              </NavigationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
