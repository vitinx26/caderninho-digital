/**
 * RecuperacaoSenha - Tela de recuperação de senha
 * Permite usuários resetarem senha via email ou pergunta de segurança
 */

import React, { useState } from 'react';
import { ArrowLeft, Mail, HelpCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type EtapaRecuperacao = 'inicio' | 'email' | 'pergunta' | 'novaSenha' | 'sucesso';

export default function RecuperacaoSenha({ onVoltar }: { onVoltar: () => void }) {
  const [etapa, setEtapa] = useState<EtapaRecuperacao>('inicio');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [respostaSeguranca, setRespostaSeguranca] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSolicitarPorEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    try {
      setCarregando(true);
      
      // Simular solicitação de recuperação
      const tokenGerado = Math.random().toString(36).substr(2) + Date.now().toString(36);
      
      toast.success('Verifique seu email para o link de recuperação');
      toast.info(`Token: ${tokenGerado}`);
      
      setToken(tokenGerado);
      setEtapa('novaSenha');
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      toast.error('Erro ao solicitar recuperação de senha');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarPorPergunta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !respostaSeguranca) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setCarregando(true);
      
      // Simular verificação de pergunta de segurança
      const tokenGerado = Math.random().toString(36).substr(2) + Date.now().toString(36);
      
      toast.success('Identidade verificada');
      setToken(tokenGerado);
      setEtapa('novaSenha');
    } catch (error) {
      console.error('Erro ao verificar identidade:', error);
      toast.error('Erro ao verificar identidade');
    } finally {
      setCarregando(false);
    }
  };

  const handleResetarSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('Senhas não conferem');
      return;
    }

    if (novaSenha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setCarregando(true);
      
      // Simular reset de senha
      toast.success('Senha alterada com sucesso!');
      setEtapa('sucesso');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onVoltar}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Recuperar Senha</h1>
        </div>

        {/* Etapa: Início */}
        {etapa === 'inicio' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Escolha como deseja recuperar sua senha:
            </p>

            <button
              onClick={() => setEtapa('email')}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition"
            >
              <Mail className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Recuperar por Email</p>
                <p className="text-sm text-gray-500">Receba um link no seu email</p>
              </div>
            </button>

            <button
              onClick={() => setEtapa('pergunta')}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition"
            >
              <HelpCircle className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Responder Pergunta de Segurança</p>
                <p className="text-sm text-gray-500">Responda uma pergunta sobre você</p>
              </div>
            </button>
          </div>
        )}

        {/* Etapa: Email */}
        {etapa === 'email' && (
          <form onSubmit={handleSolicitarPorEmail} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={carregando}
              />
            </div>

            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>

            <button
              type="button"
              onClick={() => setEtapa('inicio')}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Voltar
            </button>
          </form>
        )}

        {/* Etapa: Pergunta de Segurança */}
        {etapa === 'pergunta' && (
          <form onSubmit={handleRecuperarPorPergunta} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={carregando}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Qual é o seu nome?</label>
              <Input
                type="text"
                value={respostaSeguranca}
                onChange={(e) => setRespostaSeguranca(e.target.value)}
                placeholder="Seu nome completo"
                disabled={carregando}
              />
              <p className="text-xs text-gray-500 mt-1">Digite exatamente como está cadastrado</p>
            </div>

            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Verificando...' : 'Verificar Identidade'}
            </Button>

            <button
              type="button"
              onClick={() => setEtapa('inicio')}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Voltar
            </button>
          </form>
        )}

        {/* Etapa: Nova Senha */}
        {etapa === 'novaSenha' && (
          <form onSubmit={handleResetarSenha} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Identidade verificada. Defina uma nova senha.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nova Senha</label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={carregando}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
              <Input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua senha"
                disabled={carregando}
              />
            </div>

            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        )}

        {/* Etapa: Sucesso */}
        {etapa === 'sucesso' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <Lock className="w-6 h-6 text-green-600" />
            </div>

            <h2 className="text-xl font-bold">Senha Alterada com Sucesso!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Você pode fazer login com sua nova senha agora.
            </p>

            <Button onClick={onVoltar} className="w-full">
              Voltar ao Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
