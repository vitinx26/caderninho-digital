/**
 * Login - Tela de autenticação
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type AbaType = 'login' | 'registro' | 'inicio';

export default function Login() {
  const { fazer_login, fazer_registro, entrarComContaGeral } = useAuth();
  const [aba, setAba] = useState<AbaType>('inicio');

  // Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Registro
  const [emailRegistro, setEmailRegistro] = useState('');
  const [senhaRegistro, setSenhaRegistro] = useState('');
  const [nomeRegistro, setNomeRegistro] = useState('');
  const [telefoneRegistro, setTelefoneRegistro] = useState('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'cliente'>('cliente');
  const [carregandoRegistro, setCarregandoRegistro] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin || !senhaLogin) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setCarregandoLogin(true);
      await fazer_login(emailLogin, senhaLogin);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegistro || !senhaRegistro || !nomeRegistro) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setCarregandoRegistro(true);
      await fazer_registro(emailRegistro, senhaRegistro, nomeRegistro, tipoUsuario, telefoneRegistro || undefined, tipoUsuario === 'admin' ? nomeEstabelecimento : undefined);
      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer registro');
    } finally {
      setCarregandoRegistro(false);
    }
  };

  const handleContaGeral = () => {
    entrarComContaGeral();
    toast.success('Entrando com conta geral...');
  };

  if (aba === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
              <span className="text-3xl font-bold">C</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Caderninho Digital</h1>
            <p className="text-muted-foreground mt-2">Controle de dívidas com agilidade</p>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <Button
              onClick={() => setAba('login')}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Fazer Login
            </Button>

            <Button
              onClick={handleContaGeral}
              variant="outline"
              className="w-full py-3 border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-semibold flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              Conta Geral (Compras Rápidas)
            </Button>
          </div>

          {/* Informações */}
          <div className="card-minimal p-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Login:</strong> Para admins e clientes cadastrados
            </p>
            <p>
              <strong>Conta Geral:</strong> Registra compras rápidas sem login
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (aba === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form onSubmit={handleLogin} className="card-minimal p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Fazer Login</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="seu@email.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
              <Input
                type="password"
                value={senhaLogin}
                onChange={(e) => setSenhaLogin(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={carregandoLogin}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {carregandoLogin ? 'Entrando...' : 'Entrar'}
            </Button>

            <button
              type="button"
              onClick={() => setAba('inicio')}
              className="w-full text-sm text-primary hover:underline"
            >
              ← Voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (aba === 'registro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form onSubmit={handleRegistro} className="card-minimal p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Criar Conta</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
              <Input
                type="text"
                value={nomeRegistro}
                onChange={(e) => setNomeRegistro(e.target.value)}
                placeholder="Seu nome"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={emailRegistro}
                onChange={(e) => setEmailRegistro(e.target.value)}
                placeholder="seu@email.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
              <Input
                type="password"
                value={senhaRegistro}
                onChange={(e) => setSenhaRegistro(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Telefone (opcional)</label>
              <Input
                type="tel"
                value={telefoneRegistro}
                onChange={(e) => setTelefoneRegistro(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tipo de Usuário</label>
              <select
                value={tipoUsuario}
                onChange={(e) => setTipoUsuario(e.target.value as 'admin' | 'cliente')}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="cliente">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {tipoUsuario === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome do Estabelecimento *</label>
                <Input
                  type="text"
                  value={nomeEstabelecimento}
                  onChange={(e) => setNomeEstabelecimento(e.target.value)}
                  placeholder="Ex: Padaria do João"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Este nome será exibido no Dashboard e identificará seu estabelecimento
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={carregandoRegistro}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {carregandoRegistro ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <button
              type="button"
              onClick={() => setAba('inicio')}
              className="w-full text-sm text-primary hover:underline"
            >
              ← Voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
