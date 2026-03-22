/**
 * GerenciarUsuarios - Página de administração de usuários
 * Apenas admins podem editar e deletar usuários
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Usuario } from '@/types';

export default function GerenciarUsuarios() {
  const { voltar } = useNavigation();
  const { usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarFormNovoUsuario, setMostrarFormNovoUsuario] = useState(false);

  // Formulário de edição
  const [formData, setFormData] = useState<Partial<Usuario>>({});

  // Novo usuário
  const [novoUsuario, setNovoUsuario] = useState({
    email: '',
    senha: '',
    nome: '',
    tipo: 'cliente' as const,
    telefone: '',
  });

  // Carregar usuários do servidor
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        setCarregando(true);
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Erro ao carregar usuários');
        }
        const data = await response.json();
        setUsuarios(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setCarregando(false);
      }
    };

    carregarUsuarios();
    
    // Polling inteligente: sincroniza a cada 3s, MAS para quando está editando
    const interval = setInterval(() => {
      if (!editandoId) { // Só sincroniza se não está editando
        carregarUsuarios();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [editandoId]);

  // Verificar se é admin
  if (usuarioLogado?.tipo !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-foreground font-semibold mb-4">Acesso Negado</p>
          <p className="text-muted-foreground mb-6">Apenas administradores podem acessar esta página</p>
          <Button onClick={voltar} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const handleEditarUsuario = (usuario: Usuario) => {
    setEditandoId(usuario.id);
    setFormData({ ...usuario });
  };

  const handleSalvarEdicao = async () => {
    if (!editandoId) return;

    if (!formData.email?.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!formData.nome?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch(`/api/users/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.nome.trim(),
          role: formData.tipo || 'user',
          ativo: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar usuário');
      }

      // Recarregar usuários após atualização
      const usuariosResponse = await fetch('/api/users');
      if (usuariosResponse.ok) {
        const data = await usuariosResponse.json();
        setUsuarios(data.data || []);
      }
      setEditandoId(null);
      toast.success('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeletarUsuario = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar usuário');
      }

      setUsuarios(usuarios.filter(u => u.id !== id));
      toast.success('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário');
    }
  };

  const handleAdicionarNovoUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novoUsuario.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!novoUsuario.senha.trim()) {
      toast.error('Senha é obrigatória');
      return;
    }

    if (novoUsuario.senha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (!novoUsuario.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: novoUsuario.email.trim(),
          nome: novoUsuario.nome.trim(),
          tipo: novoUsuario.tipo,
          telefone: novoUsuario.telefone || '',
          senha: novoUsuario.senha,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
      }

      const usuarioNovo = await response.json();
      setUsuarios([...usuarios, usuarioNovo.data]);
      setNovoUsuario({
        email: '',
        senha: '',
        nome: '',
        tipo: 'cliente',
        telefone: '',
      });
      setMostrarFormNovoUsuario(false);
      toast.success('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={voltar}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
              <p className="text-muted-foreground">Administre admins e clientes do sistema</p>
            </div>
          </div>
          <Button
            onClick={() => setMostrarFormNovoUsuario(!mostrarFormNovoUsuario)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Formulário Novo Usuário */}
        {mostrarFormNovoUsuario && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Criar Novo Usuário</h2>
            <form onSubmit={handleAdicionarNovoUsuario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome
                  </label>
                  <Input
                    type="text"
                    value={novoUsuario.nome}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={novoUsuario.email}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo
                  </label>
                  <select
                    value={novoUsuario.tipo as string}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    value={novoUsuario.telefone}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Senha
                  </label>
                  <Input
                    type="password"
                    value={novoUsuario.senha}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Criar Usuário</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarFormNovoUsuario(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Usuários */}
        {carregando ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                {editandoId === usuario.id ? (
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Nome
                        </label>
                        <Input
                          type="text"
                          value={formData.nome || ''}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={formData.email || ''}
                          disabled
                          className="opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Tipo
                        </label>
                        <select
                          value={(formData.tipo as string) || 'cliente'}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="cliente">Cliente</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Telefone
                        </label>
                        <Input
                          type="tel"
                          value={formData.telefone || ''}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSalvarEdicao}>Salvar</Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditandoId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{usuario.nome}</p>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {usuario.tipo === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                        {usuario.telefone && (
                          <span className="text-xs text-muted-foreground">{usuario.telefone}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditarUsuario(usuario)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletarUsuario(usuario.id)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
