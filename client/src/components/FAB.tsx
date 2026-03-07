/**
 * FAB (Floating Action Button) - Botão flutuante para ações rápidas
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  label?: string;
}

export function FAB({ onClick, label = 'Novo Lançamento' }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-medium z-40"
      title={label}
    >
      <Plus size={20} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
