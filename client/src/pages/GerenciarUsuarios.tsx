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
import * as db from '@/lib/db';
import { salvarSenhaSegura } from '@/lib/passwordPersistence';
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

  // Carregar usuários
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        setCarregando(true);
        const usuariosCarregados = await db.obterTodosUsuarios();
        setUsuarios(usuariosCarregados);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setCarregando(false);
      }
    };

    carregarUsuarios();
  }, []);

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
      const usuarioAtualizado: Usuario = {
        id: editandoId,
        email: formData.email.trim(),
        nome: formData.nome.trim(),
        tipo: formData.tipo || 'cliente',
        telefone: formData.telefone || '',
        senha: formData.senha || '',
        dataCriacao: formData.dataCriacao || Date.now(),
      };

      await db.adicionarUsuario(usuarioAtualizado);

      // Se senha foi alterada, salvar com segurança
      if (formData.senha && formData.senha.trim()) {
        await salvarSenhaSegura(formData.email.trim(), formData.senha.trim());
      }

      setUsuarios(usuarios.map(u => u.id === editandoId ? usuarioAtualizado : u));
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
      // Nota: IndexedDB não tem método delete nativo, então apenas removemos da lista
      // Em produção, seria necessário implementar um método de soft delete
      const usuarioADeletar = usuarios.find(u => u.id === id);
      
      if (usuarioADeletar) {
        // Marcar como deletado (soft delete)
        const usuarioDeletado = {
          ...usuarioADeletar,
          ativo: false,
        };
        await db.adicionarUsuario(usuarioDeletado);
        setUsuarios(usuarios.filter(u => u.id !== id));
        toast.success('Usuário deletado com sucesso!');
      }
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
      // Verificar se email já existe
      const usuarioExistente = await db.obterUsuarioPorEmail(novoUsuario.email.trim());
      if (usuarioExistente) {
        toast.error('Email já cadastrado');
        return;
      }

      const usuarioNovo: Usuario = {
        id: Math.random().toString(36).substr(2, 9),
        email: novoUsuario.email.trim(),
        senha: novoUsuario.senha,
        nome: novoUsuario.nome.trim(),
        tipo: novoUsuario.tipo,
        telefone: novoUsuario.telefone || '',
        dataCriacao: Date.now(),
      };

      await db.adicionarUsuario(usuarioNovo);
      await salvarSenhaSegura(novoUsuario.email.trim(), novoUsuario.senha);

      setUsuarios([...usuarios, usuarioNovo]);
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
      toast.error('Erro ao criar usuário');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={voltar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">Edite ou delete usuários cadastrados</p>
          </div>
        </div>

        {/* Botão Novo Usuário */}
        <Button
          onClick={() => setMostrarFormNovoUsuario(!mostrarFormNovoUsuario)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus size={20} />
          Novo Usuário
        </Button>

        {/* Formulário Novo Usuário */}
        {mostrarFormNovoUsuario && (
          <form onSubmit={handleAdicionarNovoUsuario} className="card-minimal p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Adicionar Novo Usuário</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome *</label>
              <Input
                type="text"
                value={novoUsuario.nome}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                placeholder="Nome do usuário"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
              <Input
                type="email"
                value={novoUsuario.email}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Senha *</label>
              <Input
                type="password"
                value={novoUsuario.senha}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
              <Input
                type="tel"
                value={novoUsuario.telefone}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
              <select
                value={novoUsuario.tipo}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, tipo: e.target.value as any })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="cliente">Cliente</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Criar Usuário
              </Button>
              <Button
                type="button"
                onClick={() => setMostrarFormNovoUsuario(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Lista de Usuários */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Usuários Cadastrados</h2>

          {carregando ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div className="card-minimal p-8 text-center">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="card-minimal p-4">
                  {editandoId === usuario.id ? (
                    // Modo Edição
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                        <Input
                          type="text"
                          value={formData.nome || ''}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <Input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Nova Senha (deixe em branco para não alterar)</label>
                        <Input
                          type="password"
                          value={formData.senha || ''}
                          onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                          placeholder="Deixe em branco para manter a senha atual"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                        <Input
                          type="tel"
                          value={formData.telefone || ''}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                        <select
                          value={formData.tipo || 'cliente'}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="cliente">Cliente</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSalvarEdicao}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Salvar
                        </Button>
                        <Button
                          onClick={() => setEditandoId(null)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modo Visualização
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{usuario.nome}</p>
                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                            {usuario.tipo === 'admin' ? '👤 Admin' : '👥 Cliente'}
                          </span>
                          {usuario.telefone && (
                            <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                              📱 {usuario.telefone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditarUsuario(usuario)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Edit2 size={20} className="text-primary" />
                        </button>
                        <button
                          onClick={() => handleDeletarUsuario(usuario.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Deletar usuário"
                        >
                          <Trash2 size={20} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
