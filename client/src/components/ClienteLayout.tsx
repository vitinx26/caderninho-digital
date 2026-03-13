/**
 * ClienteLayout - Layout específico para clientes logados
 * Permite navegação entre ClienteView e NovoLancamento
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import ClienteView from '@/pages/ClienteView';
import NovoLancamento from '@/pages/NovoLancamento';

type ClientePaginaType = 'meus-gastos' | 'novo-lancamento';

export function ClienteLayout() {
  const [paginaAtual, setPaginaAtual] = useState<ClientePaginaType>('meus-gastos');

  const irPara = (pagina: ClientePaginaType) => {
    setPaginaAtual(pagina);
  };

  const voltar = () => {
    setPaginaAtual('meus-gastos');
  };

  return (
    <div>
      {paginaAtual === 'meus-gastos' && (
        <ClienteView onNovoLancamento={() => irPara('novo-lancamento')} />
      )}
      {paginaAtual === 'novo-lancamento' && (
        <NovoLancamento onVoltar={voltar} />
      )}
    </div>
  );
}
