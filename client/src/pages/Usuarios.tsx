/**
 * Usuarios.tsx - Página de gerenciamento de usuários (admin)
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState } from 'react';
import { Users, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUsuarios } from '@/hooks/useData';

export default function Usuarios() {
  const { usuarioLogado } = useAuth();
  const usuariosQuery = useUsuarios();
  
  const [editandoUsuario, setEditandoUsuario] = useState<any>(null);
  const [usuarioEditNome, setUsuarioEditNome] = useState('');
  const [usuarioEditEmail, setUsuarioEditEmail] = useState('');
  const [usuarioEditTelefone, setUsuarioEditTelefone] = useState('');
  
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoTipo, setNovoTipo] = useState('cliente');

  // Verificar se é admin
  if (usuarioLogado?.tipo !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Acesso restrito a administradores</p>
        </div>
      </div>
    );
  }

  const handleCriarUsuario = async () => {
    if (!novoNome || !novoEmail) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
          telefone: novoTelefone,
          tipo: novoTipo,
        }),
      });

      if (response.ok) {
        toast.success('Usuário criado com sucesso');
        setNovoNome('');
        setNovoEmail('');
        setNovoTelefone('');
        setNovoTipo('cliente');
        setCriandoUsuario(false);
        usuariosQuery.refetch?.();
      } else {
        toast.error('Erro ao criar usuário');
      }
    } catch (error) {
      toast.error('Erro ao criar usuário');
    }
  };

  const handleEditarUsuario = async () => {
    if (!usuarioEditNome || !usuarioEditEmail) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      const response = await fetch(`/api/users/${editandoUsuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: usuarioEditNome,
          email: usuarioEditEmail,
          telefone: usuarioEditTelefone,
        }),
      });

      if (response.ok) {
        toast.success('Usuário atualizado com sucesso');
        setEditandoUsuario(null);
        usuariosQuery.refetch?.();
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeletarUsuario = async (usuario: any) => {
    if (confirm(`Tem certeza que deseja deletar ${usuario.nome}?`)) {
      try {
        const response = await fetch(`/api/users/${usuario.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Usuário deletado com sucesso');
          usuariosQuery.refetch?.();
        } else {
          toast.error('Erro ao deletar usuário');
        }
      } catch (error) {
        toast.error('Erro ao deletar usuário');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users size={32} className="text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          </div>
          <Button
            onClick={() => setCriandoUsuario(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Usuário
          </Button>
        </div>

        {/* Modal de Criar Usuário */}
        {criandoUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-foreground mb-4">Criar Novo Usuário</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Nome do usuário"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <Input
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    type="email"
                    placeholder="email@exemplo.com"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
                  <Input
                    value={novoTelefone}
                    onChange={(e) => setNovoTelefone(e.target.value)}
                    placeholder="11999999999"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCriarUsuario}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Criar
                  </Button>
                  <Button
                    onClick={() => setCriandoUsuario(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Usuário */}
        {editandoUsuario && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-foreground mb-4">Editar Usuário</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nome</label>
                  <Input
                    value={usuarioEditNome}
                    onChange={(e) => setUsuarioEditNome(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <Input
                    value={usuarioEditEmail}
                    onChange={(e) => setUsuarioEditEmail(e.target.value)}
                    type="email"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
                  <Input
                    value={usuarioEditTelefone}
                    onChange={(e) => setUsuarioEditTelefone(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEditarUsuario}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Salvar
                  </Button>
                  <Button
                    onClick={() => setEditandoUsuario(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Usuários */}
        <div className="card-minimal p-6">
          {usuariosQuery.isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando usuários...</p>
          ) : usuariosQuery.isError ? (
            <p className="text-red-600 text-center py-8">Erro ao carregar usuários</p>
          ) : (usuariosQuery.data || []).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum usuário cadastrado</p>
          ) : (
            <div className="space-y-3">
              {(usuariosQuery.data || []).map((usuario: any) => (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{usuario.nome}</p>
                    <p className="text-sm text-muted-foreground truncate">{usuario.email}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{usuario.telefone || 'Sem telefone'}</span>
                      <span className="capitalize font-medium text-primary">
                        {usuario.tipo === 'admin' ? '👤 Admin' : '👥 Cliente'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditandoUsuario(usuario);
                        setUsuarioEditNome(usuario.nome);
                        setUsuarioEditEmail(usuario.email);
                        setUsuarioEditTelefone(usuario.telefone || '');
                      }}
                      title="Editar usuário"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletarUsuario(usuario)}
                      title="Deletar usuário"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="card-minimal p-6 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong>Total de usuários:</strong> {(usuariosQuery.data || []).length}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Nota:</strong> Apenas administradores podem gerenciar usuários. 
            Clique em "Novo Usuário" para adicionar um novo usuário ao sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
