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
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientePerfil from "./pages/ClientePerfil";
import NovoLancamento from "./pages/NovoLancamento";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import ClienteView from "./pages/ClienteView";
import ContaGeral from "./pages/ContaGeral";
import ErrorBoundary from "./components/ErrorBoundary";
import * as db from "./lib/db";
import * as backup from "./lib/backup";

function RouterContent() {
  const { usuarioLogado, carregando, usuarioGeral } = useAuth();
  const { paginaAtual } = useNavigation();

  // Recuperar dados antigos na primeira carga
  useEffect(() => {
    db.recuperarDadosAntigos().catch(console.error);
  }, []);

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
    // Agendar backup automático para conta geral também
    useEffect(() => {
      const cancelarBackup = backup.agendarBackupAutomatico(30);
      return () => cancelarBackup();
    }, []);
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
      </Layout>
    );
  }

  // Se é cliente, mostrar apenas sua visualização
  if (usuarioLogado?.tipo === 'cliente') {
    return <ClienteView />;
  }

  return <Login />;
}

function App() {
  // Recuperar dados antigos na primeira carga do app
  useEffect(() => {
    db.recuperarDadosAntigos().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <NavigationProvider>
              <RouterContent />
            </NavigationProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
