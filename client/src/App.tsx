/**
 * App.tsx - Componente raiz do Caderninho Digital
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import { useEffect } from 'react';
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
import Backups from "./pages/Backups";
import { ClienteLayout } from "./components/ClienteLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import UpdateNotification from "./components/UpdateNotification";
import { useUpdateCheck } from "./hooks/useUpdateCheck";
import * as backup from "./lib/backup";

function RouterContent() {
  const { usuarioLogado, carregando, usuarioGeral } = useAuth();
  const { paginaAtual } = useNavigation();

  // Nota: Migração já é feita no AuthProvider, não duplicar aqui

  // Agendar backup automático a cada 60 minutos
  useEffect(() => {
    const cancelarBackup = backup.agendarBackupAutomatico(60);
    return () => cancelarBackup();
  }, []);

  // Sincronizar entre abas do navegador
  useEffect(() => {
    const cancelarSincronizacao = backup.sincronizarEntreAbas(() => {
      // Recarregar dados quando outra aba faz backup
      window.location.reload();
    });
    return () => cancelarSincronizacao();
  }, []);

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
        {paginaAtual === 'backups' && <Backups />}
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

function App() {
  // Nota: Migração é feita automaticamente no AuthProvider

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <NavigationProvider>
              <AppContent />
            </NavigationProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
