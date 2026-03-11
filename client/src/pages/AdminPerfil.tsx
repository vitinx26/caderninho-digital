/**
 * AdminPerfil - Página de perfil do administrador
 * Permite editar informações do estabelecimento
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AdminPerfil() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [estabelecimentoId, setEstabelecimentoId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Buscar estabelecimentos do admin
  const { data: estabelecimentos } = trpc.estabelecimentos.listar.useQuery(undefined, {
    enabled: !!user && user.role === 'admin',
  });

  // Buscar dados do estabelecimento selecionado
  const { data: estabelecimento } = trpc.estabelecimentos.obter.useQuery(
    { id: estabelecimentoId || 0 },
    { enabled: !!estabelecimentoId }
  );

  // Mutation para atualizar estabelecimento
  const atualizarMutation = trpc.estabelecimentos.atualizar.useMutation({
    onSuccess: () => {
      toast.success('Estabelecimento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Atualizar form quando estabelecimento é carregado
  useEffect(() => {
    if (estabelecimento) {
      setFormData({
        nome: estabelecimento.nome || '',
        telefone: estabelecimento.telefone || '',
        email: estabelecimento.email || '',
      });
    }
  }, [estabelecimento]);

  // Selecionar primeiro estabelecimento automaticamente
  useEffect(() => {
    if (estabelecimentos && estabelecimentos.length > 0 && !estabelecimentoId) {
      setEstabelecimentoId(estabelecimentos[0].id);
    }
  }, [estabelecimentos, estabelecimentoId]);

  const handleSalvar = async () => {
    if (!estabelecimentoId) {
      toast.error('Selecione um estabelecimento');
      return;
    }

    setIsLoading(true);
    try {
      await atualizarMutation.mutateAsync({
        id: estabelecimentoId,
        ...formData,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Acesso não autorizado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Perfil do Estabelecimento</h1>
            <p className="text-muted-foreground mt-2">Edite as informações do seu estabelecimento</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Voltar
          </Button>
        </div>

        {/* Seletor de Estabelecimento */}
        {estabelecimentos && estabelecimentos.length > 1 && (
          <div className="card-minimal p-6 mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Selecione o Estabelecimento
            </label>
            <select
              value={estabelecimentoId || ''}
              onChange={(e) => setEstabelecimentoId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {estabelecimentos.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Formulário */}
        {estabelecimentoId && (
          <div className="card-minimal p-6 space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome do Estabelecimento
              </label>
              <Input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Mercearia do João"
                className="w-full"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Telefone
              </label>
              <Input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="Ex: (11) 98697-5039"
                className="w-full"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: contato@estabelecimento.com"
                className="w-full"
              />
            </div>

            {/* Botão Salvar */}
            <Button
              onClick={handleSalvar}
              disabled={isLoading || atualizarMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-12"
            >
              <Save size={20} />
              {isLoading || atualizarMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        )}

        {/* Mensagem quando não há estabelecimentos */}
        {estabelecimentos && estabelecimentos.length === 0 && (
          <div className="card-minimal p-8 text-center">
            <p className="text-muted-foreground mb-4">Você não tem estabelecimentos cadastrados</p>
            <Button
              onClick={() => setLocation('/dashboard')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ir para Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
