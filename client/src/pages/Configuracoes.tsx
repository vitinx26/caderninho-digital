/**
 * Configurações - Ajustes do aplicativo
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as db from '@/lib/db';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;  
}

export default function Configuracoes() {
  const [diasParaVencer, setDiasParaVencer] = useState(30);
  const [carregando, setCarregando] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalavel, setPwaInstalavel] = useState(false);

  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const config = await db.obterConfiguracao();
        if (config) {
          setDiasParaVencer(config.diasParaVencer);
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
      await db.salvarConfiguracao({
        diasParaVencer,
        ultimoBackup: Date.now(),
        versao: '1.0.0',
      });
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleInstalarApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('App instalado com sucesso!');
          setDeferredPrompt(null);
          setPwaInstalavel(false);
        } else {
          toast.info('Instalação cancelada');
        }
      } catch (error) {
        toast.error('Erro ao instalar o app');
      }
    } else {
      toast.info('Use o menu do navegador (⋮) e selecione "Instalar app" ou "Adicionar à tela inicial"');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize o seu Caderninho</p>
      </div>

      {/* Seção de Dias para Vencer */}
      <div className="card-minimal p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Prazos</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Dias para marcar como vencido
            </label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="1"
                max="365"
                value={diasParaVencer}
                onChange={(e) => setDiasParaVencer(parseInt(e.target.value) || 30)}
                className="w-24"
              />
              <span className="text-muted-foreground">dias</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Débitos sem pagamento há mais de {diasParaVencer} dias serão marcados como vencidos.
            </p>
          </div>
          <Button
            onClick={handleSalvarConfig}
            disabled={carregando}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
          Instale o Caderninho Digital como um app no seu celular para acesso rápido e offline.
        </p>
        <Button
          onClick={handleInstalarApp}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
        >
          <Download size={20} />
          Instalar App
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          {pwaInstalavel
            ? 'Clique no botão acima para instalar o app no seu dispositivo'
            : 'Se o botão não funcionar, use o menu do navegador (⋮) e selecione "Instalar app" ou "Adicionar à tela inicial".'}
        </p>
      </div>

      {/* Seção de Informações */}
      <div className="card-minimal p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Sobre</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Caderninho Digital</strong> v1.0.0
          </p>
          <p>Um aplicativo simples e rápido para controlar dívidas e crediário.</p>
          <p>
            Todos os seus dados são armazenados localmente no seu dispositivo. Nenhuma informação é
            enviada para servidores externos.
          </p>
          <p className="mt-4">
            <strong>Funcionalidades:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Controle de clientes e dívidas</li>
            <li>Registro de débitos e pagamentos</li>
            <li>Relatórios e gráficos</li>
            <li>Funcionamento offline</li>
            <li>Backup e restauração de dados</li>
            <li>Integração com WhatsApp</li>
          </ul>
        </div>
      </div>

      {/* Seção de Privacidade */}
      <div className="card-minimal p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Privacidade</h2>
        <p className="text-sm text-muted-foreground">
          O Caderninho Digital respeita sua privacidade. Todos os dados são armazenados localmente no
          seu dispositivo e nunca são compartilhados com terceiros. Você tem controle total sobre seus
          dados e pode exportá-los ou deletá-los a qualquer momento.
        </p>
      </div>
    </div>
  );
}
