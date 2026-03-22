/**
 * MigracaoAutomatica - DESABILITADA
 * Todos os dados agora estão centralizados no banco de dados TiDB Cloud
 * Não há mais necessidade de recuperação de dados locais
 */

import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';

export default function MigracaoAutomatica() {
  const { voltar } = useNavigation();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={voltar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dados Centralizados</h1>
            <p className="text-muted-foreground">Todos os dados estão sincronizados na nuvem</p>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-green-800 font-bold text-lg mb-3">✅ Migração Concluída!</p>
              <p className="text-green-700 mb-4">
                Todos os dados foram migrados com sucesso para o banco de dados centralizado em nuvem (TiDB Cloud).
              </p>
              <ul className="text-green-700 space-y-2 mb-4">
                <li>✓ Administradores sincronizados: victorhgs26@gmail.com, trc290382@gmail.com</li>
                <li>✓ Dados acessíveis em qualquer dispositivo</li>
                <li>✓ Sincronização automática entre admins</li>
                <li>✓ Nenhum dado será perdido</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Como Funciona Agora</h2>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary font-bold flex-shrink-0">1.</span>
              <span>Todos os dados são armazenados no banco de dados centralizado em nuvem</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold flex-shrink-0">2.</span>
              <span>Múltiplos administradores veem os mesmos dados em tempo real</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold flex-shrink-0">3.</span>
              <span>Alterações feitas por um admin aparecem automaticamente para os outros</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold flex-shrink-0">4.</span>
              <span>Dados persistem mesmo após fechar o navegador ou trocar de dispositivo</span>
            </li>
          </ol>
        </div>

        {/* Botão */}
        <div className="flex gap-4">
          <Button onClick={voltar} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
