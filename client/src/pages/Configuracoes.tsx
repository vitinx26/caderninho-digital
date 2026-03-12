/**
 * Configurações - Ajustes do aplicativo
 * Design: Minimalismo Funcional com Tipografia Forte
 */

import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, Info, Download, Cloud, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import * as db from '@/lib/db';
import * as backup from '@/lib/backup';
import { migrateAllOldData } from '@/lib/migrate';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;  
}

export default function Configuracoes() {
  const { usuarioLogado } = useAuth();
  const [diasParaVencer, setDiasParaVencer] = useState(30);
  const [numeroWhatsApp, setNumeroWhatsApp] = useState('');
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('');
  const [templateWhatsApp, setTemplateWhatsApp] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalavel, setPwaInstalavel] = useState(false);
  const [ultimoBackup, setUltimoBackup] = useState<number | null>(null);
  const [carregandoBackup, setCarregandoBackup] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const carregarConfig = async () => {
      try {
        const config = await db.obterConfiguracao();
        if (config) {
          setDiasParaVencer(config.diasParaVencer);
          setNumeroWhatsApp(config.numeroWhatsAppAdmin || '');
        }
        if (usuarioLogado?.nomeEstabelecimento) {
          setNomeEstabelecimento(usuarioLogado.nomeEstabelecimento);
        }
        if (usuarioLogado?.templateWhatsapp) {
          setTemplateWhatsApp(usuarioLogado.templateWhatsapp);
        }
        const ultimoBackupTime = backup.obterTimestampUltimoBackup();
        setUltimoBackup(ultimoBackupTime);
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
        numeroWhatsAppAdmin: numeroWhatsApp || undefined,
      });
      
      // Atualizar nome do estabelecimento no localStorage
      if (usuarioLogado && nomeEstabelecimento) {
        const usuarioAtualizado = {
          ...usuarioLogado,
          nomeEstabelecimento,
        };
        localStorage.setItem('caderninho_session', JSON.stringify(usuarioAtualizado));
      }
      
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

      {/* Seção de Estabelecimento */}
      <div className="card-minimal p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Estabelecimento</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nome do Estabelecimento
            </label>
            <Input
              type="text"
              placeholder="Ex: Padaria do João"
              value={nomeEstabelecimento}
              onChange={(e) => setNomeEstabelecimento(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Este nome será exibido no topo do Dashboard
            </p>
          </div>
        </div>
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Número do WhatsApp para cobranças
            </label>
            <Input
              type="tel"
              placeholder="11986975039"
              value={numeroWhatsApp}
              onChange={(e) => setNumeroWhatsApp(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Digite seu número do WhatsApp com código de país (ex: 55 para Brasil)
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

      {/* Seção de Template WhatsApp */}
      <div className="card-minimal p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Mensagem de Cobrança WhatsApp</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Personalize o texto enviado para cobrar seus clientes
            </label>
            <textarea
              placeholder="Ex: Olá {cliente}, você tem um débito de R$ {valor} vencido em {data}. Por favor, efetue o pagamento."
              value={templateWhatsApp}
              onChange={(e) => setTemplateWhatsApp(e.target.value)}
              className="w-full h-32 p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Você pode usar as seguintes variáveis:
            </p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1 ml-4">
              <li>• <code className="bg-muted px-1 rounded">{'{'} cliente {'}'}</code> - Nome do cliente</li>
              <li>• <code className="bg-muted px-1 rounded">{'{'} valor {'}'}</code> - Valor do débito</li>
              <li>• <code className="bg-muted px-1 rounded">{'{'} data {'}'}</code> - Data do vencimento</li>
              <li>• <code className="bg-muted px-1 rounded">{'{'} descricao {'}'}</code> - Descrição do débito</li>
            </ul>
          </div>
          <Button
            onClick={async () => {
              try {
                setCarregando(true);
                if (usuarioLogado) {
                  const usuarioAtualizado = {
                    ...usuarioLogado,
                    templateWhatsapp: templateWhatsApp,
                  };
                  await db.atualizarUsuario(usuarioAtualizado);
                  toast.success('Template de mensagem salvo com sucesso!');
                }
              } catch (error) {
                toast.error('Erro ao salvar template de mensagem');
                console.error(error);
              } finally {
                setCarregando(false);
              }
            }}
            disabled={carregando}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Salvar Template
          </Button>
        </div>
      </div>

      {/* Seção de Backup */}
      <div className="card-minimal p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cloud size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Backup e Sincronização</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Faça backup de seus dados e sincronize entre dispositivos.
        </p>
        <div className="space-y-3">
          <Button
            onClick={async () => {
              try {
                setCarregandoBackup(true);
                await backup.baixarBackupJSON();
                toast.success('Backup baixado com sucesso!');
              } catch (error) {
                toast.error('Erro ao baixar backup');
              } finally {
                setCarregandoBackup(false);
              }
            }}
            disabled={carregandoBackup}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Baixar Backup
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Restaurar Backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  setCarregandoBackup(true);
                  const backupData = await backup.carregarBackupJSON(file);
                  await backup.importarBackup(backupData);
                  toast.success('Backup restaurado com sucesso!');
                  window.location.reload();
                } catch (error) {
                  toast.error('Erro ao restaurar backup');
                } finally {
                  setCarregandoBackup(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }
            }}
          />
        </div>
        {ultimoBackup && (
          <p className="text-xs text-muted-foreground mt-4">
            Último backup: {new Date(ultimoBackup).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
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

      {/* Seção de Migração de Dados */}
      <div className="card-minimal p-6">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Recuperar Dados Antigos</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Se você tinha dados salvos em uma versão anterior do Caderninho Digital, clique no botão abaixo para recuperá-los.
        </p>
        <Button
          onClick={async () => {
            try {
              setCarregandoBackup(true);
              const resultado = await migrateAllOldData();
              toast.success(`Migração concluída! Recuperados: ${resultado.usuarios} usuários, ${resultado.clientes} clientes, ${resultado.lancamentos} lançamentos`);
              setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
              toast.error('Erro ao recuperar dados antigos');
              console.error(error);
            } finally {
              setCarregandoBackup(false);
            }
          }}
          disabled={carregandoBackup}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          Recuperar Dados Antigos
        </Button>
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

      {/* Seção de Gerenciamento de Admins */}
      {usuarioLogado?.tipo === 'admin' && (
        <div className="card-minimal p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Gerenciamento de Administradores</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Crie novos usuários administradores para gerenciar o estabelecimento
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email do novo administrador
              </label>
              <Input
                type="email"
                placeholder="novo.admin@email.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Senha temporária
              </label>
              <Input
                type="password"
                placeholder="Gerar senha aleatória"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome completo
              </label>
              <Input
                type="text"
                placeholder="Nome do novo admin"
                className="w-full"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Criar novo administrador
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}