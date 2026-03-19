/**
 * Contexto de navegação para o Caderninho Digital
 * Gerencia o estado de navegação entre telas
 */

import React, { createContext, useContext, useState } from 'react';

export type PageType = 'dashboard' | 'cliente' | 'novo-lancamento' | 'relatorios' | 'configuracoes' | 'gerenciar-usuarios' | 'backups';

interface NavigationContextType {
  paginaAtual: PageType;
  clienteSelecionado: string | null;
  irPara: (pagina: PageType, clienteId?: string) => void;
  voltar: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [paginaAtual, setPaginaAtual] = useState<PageType>('dashboard');
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [historico, setHistorico] = useState<PageType[]>(['dashboard']);

  const irPara = (pagina: PageType, clienteId?: string) => {
    setPaginaAtual(pagina);
    setClienteSelecionado(clienteId || null);
    setHistorico((prev) => [...prev, pagina]);
  };

  const voltar = () => {
    setHistorico((prev) => {
      if (prev.length > 1) {
        const novoHistorico = prev.slice(0, -1);
        setPaginaAtual(novoHistorico[novoHistorico.length - 1]);
        return novoHistorico;
      }
      return prev;
    });
  };

  return (
    <NavigationContext.Provider value={{ paginaAtual, clienteSelecionado, irPara, voltar }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser usado dentro de NavigationProvider');
  }
  return context;
}
