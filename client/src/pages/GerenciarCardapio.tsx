/**
 * GerenciarCardapio.tsx - Página de gerenciamento de cardápios (admin only)
 * 
 * Permite admin selecionar qual cardápio está ativo para o dia
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Menu } from 'lucide-react';
import { toast } from 'sonner';

interface Cardapio {
  id: string;
  nome: string;
  ativo: boolean;
  dataCriacao: number;
  itemCount?: number;
}

export default function GerenciarCardapio() {
  const { usuarioLogado } = useAuth();
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionando, setSelecionando] = useState<string | null>(null);

  // Verificar se é admin
  if (usuarioLogado?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Apenas administradores podem gerenciar cardápios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Carregar cardápios
  useEffect(() => {
    carregarCardapios();
  }, []);

  const carregarCardapios = async () => {
    try {
      setCarregando(true);
      // TODO: Implementar API para carregar cardápios
      // const response = await fetch('/api/menus');
      // const data = await response.json();
      // setCardapios(data);

      // Mock data para teste
      setCardapios([
        {
          id: '1',
          nome: 'Cardápio 1',
          ativo: true,
          dataCriacao: Date.now(),
          itemCount: 93,
        },
        {
          id: '2',
          nome: 'Cardápio 2',
          ativo: false,
          dataCriacao: Date.now() - 86400000,
          itemCount: 0,
        },
      ]);
    } catch (error) {
      console.error('Erro ao carregar cardápios:', error);
      toast.error('Erro ao carregar cardápios');
    } finally {
      setCarregando(false);
    }
  };

  const selecionarCardapio = async (cardapioId: string) => {
    try {
      setSelecionando(cardapioId);
      // TODO: Implementar API para selecionar cardápio
      // const response = await fetch(`/api/menus/${cardapioId}/activate`, {
      //   method: 'POST',
      // });

      // Mock
      setCardapios(prev =>
        prev.map(c => ({
          ...c,
          ativo: c.id === cardapioId,
        }))
      );

      toast.success('Cardápio ativado com sucesso!');
    } catch (error) {
      console.error('Erro ao selecionar cardápio:', error);
      toast.error('Erro ao ativar cardápio');
    } finally {
      setSelecionando(null);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cardápios...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Menu size={32} className="text-blue-600" />
          Gerenciar Cardápios
        </h1>
        <p className="text-muted-foreground mt-2">
          Selecione qual cardápio será utilizado hoje
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cardapios.map(cardapio => (
          <Card key={cardapio.id} className={cardapio.ativo ? 'border-green-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{cardapio.nome}</CardTitle>
                {cardapio.ativo && (
                  <Badge className="bg-green-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Ativo
                  </Badge>
                )}
              </div>
              <CardDescription>
                {cardapio.itemCount ? `${cardapio.itemCount} itens` : 'Sem itens'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Criado em {new Date(cardapio.dataCriacao).toLocaleDateString('pt-BR')}
                </p>
                {!cardapio.ativo && (
                  <Button
                    onClick={() => selecionarCardapio(cardapio.id)}
                    disabled={selecionando === cardapio.id}
                    className="w-full"
                  >
                    {selecionando === cardapio.id ? 'Ativando...' : 'Ativar Cardápio'}
                  </Button>
                )}
                {cardapio.ativo && (
                  <Button disabled className="w-full" variant="secondary">
                    Cardápio Ativo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cardapios.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle size={20} />
              Nenhum Cardápio Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum cardápio foi criado ainda. Entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
