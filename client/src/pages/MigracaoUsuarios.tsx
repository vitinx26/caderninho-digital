/**
 * MigracaoUsuarios - Página para recuperar usuários do IndexedDB
 * Apenas admins podem acessar
 */

import React, { useState } from 'react';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MigracaoUsuarios() {
  const { voltar } = useNavigation();
  const { usuarioLogado } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [usuariosExportados, setUsuariosExportados] = useState<any[]>([]);
  const [resultado, setResultado] = useState<{ sucesso: number; erro: number } | null>(null);

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

  // Exportar usuários do IndexedDB
  const handleExportarDoIndexedDB = async () => {
    try {
      setCarregando(true);
      
      // Abrir IndexedDB
      const request = indexedDB.open('CaderninhoDigital', 3);
      
      request.onerror = () => {
        toast.error('Erro ao acessar IndexedDB');
        setCarregando(false);
      };
      
      request.onsuccess = () => {
        const db = request.result;
        
        // Verificar se store de usuários existe
        if (!db.objectStoreNames.contains('usuarios')) {
          toast.error('Nenhum dado de usuários encontrado no IndexedDB');
          setCarregando(false);
          return;
        }
        
        // Ler usuários do IndexedDB
        const transaction = db.transaction(['usuarios'], 'readonly');
        const store = transaction.objectStore('usuarios');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const usuarios = getAllRequest.result;
          setUsuariosExportados(usuarios);
          
          if (usuarios.length === 0) {
            toast.warning('Nenhum usuário encontrado no IndexedDB');
          } else {
            toast.success(`${usuarios.length} usuários encontrados no IndexedDB`);
          }
          
          setCarregando(false);
        };
        
        getAllRequest.onerror = () => {
          toast.error('Erro ao ler usuários do IndexedDB');
          setCarregando(false);
        };
      };
    } catch (error) {
      console.error('Erro ao exportar do IndexedDB:', error);
      toast.error('Erro ao exportar do IndexedDB');
      setCarregando(false);
    }
  };

  // Migrar usuários para backend
  const handleMigrarParaBackend = async () => {
    if (usuariosExportados.length === 0) {
      toast.error('Nenhum usuário para migrar');
      return;
    }

    try {
      setCarregando(true);
      let sucesso = 0;
      let erro = 0;

      for (const usuario of usuariosExportados) {
        try {
          // Criar usuário no backend
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: usuario.email,
              nome: usuario.nome,
              tipo: usuario.tipo || 'cliente',
              telefone: usuario.telefone || '',
              senha: usuario.senha || 'migrado123',
            }),
          });

          if (response.ok) {
            sucesso++;
          } else {
            erro++;
            console.error(`Erro ao migrar ${usuario.email}`);
          }
        } catch (error) {
          erro++;
          console.error(`Erro ao migrar ${usuario.email}:`, error);
        }
      }

      setResultado({ sucesso, erro });
      toast.success(`Migração concluída: ${sucesso} usuários migrados, ${erro} erros`);
      setCarregando(false);
    } catch (error) {
      console.error('Erro durante migração:', error);
      toast.error('Erro durante migração');
      setCarregando(false);
    }
  };

  // Baixar usuários como JSON
  const handleBaixarJSON = () => {
    const dataStr = JSON.stringify(usuariosExportados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={voltar}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Migração de Usuários</h1>
            <p className="text-muted-foreground">Recuperar usuários do IndexedDB para o banco de dados</p>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Como Funciona</h2>
          <ol className="space-y-2 text-muted-foreground">
            <li>1. Clique em "Exportar do IndexedDB" para recuperar usuários salvos localmente</li>
            <li>2. Revise os usuários encontrados</li>
            <li>3. Clique em "Migrar para Backend" para salvar permanentemente no banco de dados</li>
            <li>4. Todos os usuários estarão disponíveis para todos os admins</li>
          </ol>
        </div>

        {/* Botões */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={handleExportarDoIndexedDB}
            disabled={carregando}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {carregando ? 'Exportando...' : 'Exportar do IndexedDB'}
          </Button>
          
          {usuariosExportados.length > 0 && (
            <>
              <Button
                onClick={handleMigrarParaBackend}
                disabled={carregando}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {carregando ? 'Migrando...' : 'Migrar para Backend'}
              </Button>
              <Button
                onClick={handleBaixarJSON}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Backup JSON
              </Button>
            </>
          )}
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              ✅ Migração Concluída
            </p>
            <p className="text-green-700">
              {resultado.sucesso} usuários migrados com sucesso
              {resultado.erro > 0 && `, ${resultado.erro} erros`}
            </p>
          </div>
        )}

        {/* Lista de Usuários */}
        {usuariosExportados.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Usuários Encontrados ({usuariosExportados.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {usuariosExportados.map((usuario, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-foreground">{usuario.nome}</p>
                    <p className="text-sm text-muted-foreground">{usuario.email}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {usuario.tipo === 'admin' ? 'Admin' : 'Cliente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
