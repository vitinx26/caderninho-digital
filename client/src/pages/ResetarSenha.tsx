/**
 * ResetarSenha.tsx - Página de recuperação de senha
 * Interface simples para resetar senha sem precisar de console
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ResetarSenhaProps {
  onVoltar: () => void;
}

export default function ResetarSenha({ onVoltar }: ResetarSenhaProps) {
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleResetar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Digite seu email');
      return;
    }

    if (!novaSenha.trim()) {
      toast.error('Digite a nova senha');
      return;
    }

    if (novaSenha !== confirmaSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setCarregando(true);

      // Abrir IndexedDB
      const dbName = 'CaderninhoDigital';
      const dbVersion = 3;

      const request = indexedDB.open(dbName, dbVersion);

      request.onerror = () => {
        throw new Error('Erro ao acessar banco de dados');
      };

      request.onsuccess = () => {
        const db = request.result;

        // Obter transação de leitura/escrita
        const transaction = db.transaction(['usuarios'], 'readwrite');
        const store = transaction.objectStore('usuarios');
        const index = store.index('email');

        // Procurar usuário por email
        const getRequest = index.get(email);

        getRequest.onerror = () => {
          throw new Error('Erro ao procurar usuário');
        };

        getRequest.onsuccess = () => {
          const usuario = getRequest.result;

          if (!usuario) {
            toast.error('Usuário não encontrado');
            setCarregando(false);
            return;
          }

          // Atualizar senha
          const usuarioAtualizado = {
            ...usuario,
            senha: novaSenha,
          };

          const updateRequest = store.put(usuarioAtualizado);

          updateRequest.onerror = () => {
            toast.error('Erro ao atualizar senha');
            setCarregando(false);
          };

          updateRequest.onsuccess = () => {
            toast.success('Senha atualizada com sucesso!');
            setEmail('');
            setNovaSenha('');
            setConfirmaSenha('');
            setCarregando(false);
            
            // Voltar para login após 2 segundos
            setTimeout(() => {
              onVoltar();
            }, 2000);
          };
        };
      };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao resetar senha');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
            <span className="text-2xl font-bold">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Resetar Senha</h1>
          <p className="text-muted-foreground mt-2">Digite seu email e a nova senha</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleResetar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full"
              disabled={carregando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nova Senha</label>
            <Input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full"
              disabled={carregando}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Confirmar Senha</label>
            <Input
              type="password"
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
              placeholder="Confirme a nova senha"
              className="w-full"
              disabled={carregando}
            />
          </div>

          <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            ℹ️ Digite seu email e a nova senha que deseja usar. Você será redirecionado para o login após atualizar.
          </p>

          <Button
            type="submit"
            disabled={carregando}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {carregando ? 'Atualizando...' : 'Resetar Senha'}
          </Button>

          <button
            type="button"
            onClick={onVoltar}
            className="w-full text-sm text-primary hover:underline"
            disabled={carregando}
          >
            ← Voltar para Login
          </button>
        </form>
      </div>
    </div>
  );
}
