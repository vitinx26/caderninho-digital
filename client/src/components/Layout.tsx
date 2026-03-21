/**
 * Layout principal do Caderninho Digital
 * Design: Minimalismo Funcional com Tipografia Forte
 * Sidebar esquerda fixa com navegação principal
 */

import React, { useState } from 'react';
import { Menu, X, Home, FileText, Settings, LogOut, Users, Cloud, Wine, Database } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { FAB } from './FAB';

interface LayoutProps {
  children: React.ReactNode;
}

function LogoutButton({ sidebarAberta }: { sidebarAberta: boolean }) {
  const { fazer_logout } = useAuth();

  return (
    <button
      onClick={fazer_logout}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
    >
      <LogOut size={20} />
      {sidebarAberta && <span>Sair</span>}
    </button>
  );
}

export function Layout({ children }: LayoutProps) {
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const { paginaAtual, irPara } = useNavigation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'gerenciar-cardapios', label: 'Cardápios', icon: Wine },
    { id: 'gerenciar-usuarios', label: 'Usuários', icon: Users },
    { id: 'migracao-usuarios', label: 'Migração', icon: Database },
    { id: 'backups', label: 'Backups', icon: Cloud },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarAberta ? 'w-64' : 'w-20'
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {sidebarAberta && (
            <h1 className="font-bold text-lg text-sidebar-foreground">Caderninho</h1>
          )}
          <button
            onClick={() => setSidebarAberta(!sidebarAberta)}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            {sidebarAberta ? (
              <X size={20} className="text-sidebar-foreground" />
            ) : (
              <Menu size={20} className="text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const ativo = paginaAtual === item.id;

            return (
              <button
                key={item.id}
                onClick={() => irPara(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  ativo
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <Icon size={20} />
                {sidebarAberta && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {sidebarAberta && <p className="text-xs text-sidebar-foreground/60">v1.0.0</p>}
          <LogoutButton sidebarAberta={sidebarAberta} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen">{children}</div>
      </main>

      {/* FAB para novo lançamento */}
      {paginaAtual === 'dashboard' && (
        <FAB onClick={() => irPara('novo-lancamento')} />
      )}
    </div>
  );
}
