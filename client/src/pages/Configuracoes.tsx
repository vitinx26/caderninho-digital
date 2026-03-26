/**
 * Configurações - Ajustes do aplicativo
 * Design: Minimalismo Funcional com Tipografia Forte
 * NOTA: Funcionalidades de backup e migração local removidas
 */

import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, Info, Trash2, Edit2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUsuarios } from '@/hooks/useData';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;  
}

export default function Configuracoes() {
  const { usuarioLogado } = useAuth();
  const usuariosQuery = useUsuarios();
  const [diasParaVencer, setDiasParaVencer] = useState(30);
  const [numeroWhatsApp, setNumeroWhatsApp] = useState('');
  const [templateWhatsApp, setTemplateWhatsApp] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalavel, setPwaInstalavel] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState<any>(null);
  const [usuarioEditNome, setUsuarioEditNome] = useState('');
  const [usuarioEditEmail, setUsuarioEditEmail] = useState('');
  const [usuarioEditTelefone, setUsuarioEditTelefone] = useState('');

  useEffect(() => {
    const carregarConfig = async () => {
      try {
        // Configurações carregadas do servidor (não mais do IndexedDB)
        if (usuarioLogado?.templateWhatsapp) {
          setTemplateWhatsApp(usuarioLogado.templateWhatsapp);
        }
      } finally {
        setCarregando(false);
      }
    };
    carregarConfig();

    // Registrar Service Worker e detectar PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        console.log('Service Worker não registrado');
      });
    }

    // Detectar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPwaInstalavel(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleSalvarConfig = async () => {
    try {
      // Salvar configurações no servidor
      const response = await fetch('/api/users/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateWhatsapp: templateWhatsApp || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações');
      }
      
      toast.success('Configuracoes salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuracoes:', error);
      toast.error('Erro ao salvar configuracoes');
    }
  };

  const handleInstalarApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setPwaInstalavel(false);
      }
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings size={32} className="text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        </div>

        {/* Seção de Configurações Gerais */}
        <div className="card-minimal p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Configurações Gerais</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Dias para Vencer (padrão)
              </label>
              <Input
                type="number"
                value={diasParaVencer}
                onChange={(e) => setDiasParaVencer(parseInt(e.target.value))}
                className="w-full"
                min="1"
                max="365"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Número WhatsApp (Admin)
              </label>
              <Input
                type="tel"
                value={numeroWhatsApp}
                onChange={(e) => setNumeroWhatsApp(e.target.value)}
                placeholder="11999999999"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Template WhatsApp
              </label>
              <textarea
                value={templateWhatsApp}
                onChange={(e) => setTemplateWhatsApp(e.target.value)}
                placeholder="Mensagem padrão para WhatsApp"
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                rows={4}
              />
            </div>

            <Button
              onClick={handleSalvarConfig}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Salvar Configurações
            </Button>
          </div>
        </div>

        {/* Seção PWA */}
        <div className="card-minimal p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Aplicativo Mobile</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Instale o Caderninho Digital como um app no seu celular para acesso rápido.
          </p>
          <Button
            onClick={handleInstalarApp}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            Instalar App
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {pwaInstalavel
              ? 'Clique no botão acima para instalar o app no seu dispositivo'
              : 'Se o botão não funcionar, siga as instruções abaixo:'}
          </p>
          {!pwaInstalavel && (
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="font-semibold text-foreground mb-1">📱 Android (Chrome):</p>
                <p className="text-muted-foreground">Toque o menu (⋮) → "Instalar app" ou "Adicionar à tela inicial"</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">🍎 iOS (Safari):</p>
                <p className="text-muted-foreground">Toque o botão Compartilhar (↗️) → "Adicionar à Tela Inicial"</p>
              </div>
            </div>
          )}
        </div>

        {/* Gerenciamento de Usuários (Admin) */}
        {usuarioLogado?.tipo === 'admin' && (
          <div className="card-minimal p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={24} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Gerenciamento de Usuários</h2>
            </div>
            
            {usuariosQuery.isLoading ? (
              <p className="text-muted-foreground">Carregando usuários...</p>
            ) : usuariosQuery.isError ? (
              <p className="text-red-600">Erro ao carregar usuários</p>
            ) : (usuariosQuery.data || []).length === 0 ? (
              <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(usuariosQuery.data || []).map((usuario: any) => (
                  <div key={usuario.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{usuario.nome}</p>
                      <p className="text-sm text-muted-foreground truncate">{usuario.email}</p>
                      <p className="text-xs text-muted-foreground">{usuario.telefone || 'Sem telefone'}</p>
                      <p className="text-xs text-muted-foreground capitalize">Tipo: {usuario.tipo}</p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditandoUsuario(usuario);
                          setUsuarioEditNome(usuario.nome);
                          setUsuarioEditEmail(usuario.email);
                          setUsuarioEditTelefone(usuario.telefone || '');
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
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
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    onClick={async () => {
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
                    }}
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

        {/* Informações */}
        <div className="card-minimal p-6 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Todas as suas configurações e dados são armazenados no servidor centralizado. 
            Nenhum dado é armazenado localmente no seu dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
}
