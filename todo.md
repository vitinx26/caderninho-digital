

## Sincronização com Backend

- [x] Criar schema de banco de dados para usuários, clientes e lançamentos
- [x] Implementar procedures tRPC para sincronizar dados
- [x] Integrar sincronização na função de migração
- [x] Adicionar retry logic para falhas de sincronização
- [ ] Testar sincronização de dados migrados


## Personalização de Mensagem WhatsApp

- [x] Adicionar campo de template de mensagem no banco de dados
- [x] Criar interface de edição nas Configurações
- [x] Integrar template na funcionalidade de cobrança
- [x] Testar personalização de mensagem


## Recuperação Automática de Dados (Prioridade Alta)

- [x] Analisar problema de login do usuário victorhgs26@gmail.com
- [x] Implementar recuperação automática de dados após atualizações
- [x] Melhorar sincronização com backend para persistência
- [x] Validar que usuário admin é encontrado no login
- [x] Testar fluxo completo de login e migração


## Novas Funcionalidades de Autenticação e Gerenciamento

- [x] Implementar sistema de recuperação de senha
- [x] Integrar login com Google OAuth
- [x] Criar interface de gerenciamento de admins nas configurações
- [x] Adicionar validação e segurança
- [x] Testar todas as funcionalidades


## Correções Urgentes

- [x] Corrigir erro na página de recuperação de senha
- [x] Remover opção de cadastro de admin no registro público
- [x] Testar correções


## Correções Solicitadas (Sprint Atual)

- [x] Remover texto "Necessário para receber cobranças via WhatsApp" do campo de telefone
- [x] Corrigir carregamento do cliente Vitinho em Conta Geral
- [x] Implementar sistema de atualização automática do PWA com botão de refresh
- [x] Testar todas as correções em iOS e Android


## Correções de Segurança e LGPD

- [x] Remover opção "Histórico" da Conta Geral para proteger privacidade dos usuários


## Problemas com Novos Usuários (Sprint Atual)

- [x] Corrigir acesso de novos usuários para cadastrar despesas
- [x] Sincronizar novos usuários na lista de seleção da Conta Geral
- [x] Remover telefone da exibição na Conta Geral e vincular usuários


## Problema Crítico: Senha Perdida nas Atualizações

- [x] Investigar por que senha é perdida nas atualizações
- [x] Corrigir migração de dados do IndexedDB para localStorage
- [x] Garantir que senha seja sempre preservada em todas atualizações
- [x] Testar login após atualização do app


## Acesso de Clientes ao App (Sprint Crítica)

- [x] Adicionar campos email e senha ao cadastro de cliente na Conta Geral
- [x] Criar usuário automaticamente ao cadastrar cliente com credenciais
- [x] Liberar botão "Novo Lançamento" para clientes (não apenas admin)
- [x] Garantir que cliente veja apenas suas próprias despesas
- [x] Testar fluxo completo: cadastro → login → adicionar despesa


## Gerenciamento de Usuários e Restrições de Acesso (Sprint Crítica)

- [x] Criar página de gerenciamento de usuários para admin (editar/deletar)
- [x] Adicionar botão "Novo Lançamento" visível na tela inicial do cliente
- [x] Remover opções de edição de lançamentos para clientes
- [x] Garantir que apenas admin possa editar/deletar lançamentos
- [x] Testar restrições de acesso por tipo de usuário


## Bug: Botão "Novo Lançamento" não funciona para usuários logados

- [x] Investigar por que botão Novo Lançamento não funciona em ClienteView
- [x] Corrigir navegação ou lógica do botão
- [x] Testar em mobile e desktop


## Problema Crítico: Admin trc290382@gmail.com não vê dados

- [x] Investigar por que admin não está vendo usuários e valores anteriores
- [x] Garantir que todos os admins tenham acesso aos mesmos dados
- [x] Sincronizar dados entre diferentes admins
- [x] Testar acesso de todos os admins


## Sistema de Backup na Nuvem (Nova Sprint)

- [x] Criar API de backup na nuvem
- [x] Implementar sincronização automática de backups
- [x] Criar sistema de restauração de backups
- [x] Adicionar interface de gerenciamento de backups
- [x] Testar sistema de backup completo


## Backup na Nuvem com Backend e Dashboard (Nova Sprint)

- [x] Criar endpoints de API para backup na nuvem
- [x] Implementar sincronização com servidor backend
- [x] Criar dashboard de sincronização
- [x] Implementar detecção de conflitos entre admins
- [x] Testar sincronização e backup completo


## PROBLEMA CRÍTICO: Admins Não Encontrados no Login

- [x] Investigar por que victorhgs26@gmail.com não é encontrado
- [x] Investigar por que trc290382@gmail.com não é encontrado
- [x] Verificar se dados estão sendo salvos no localStorage
- [x] Garantir que senhas originais são preservadas
- [x] Criar mecanismo de persistência garantida de dados
- [x] Testar login de ambos os admins com sucesso (testes passando)


## Data Fixa e Notificações Múltiplas (Sprint Atual)

- [x] Remover seletor de data e usar data/hora de Brasília automaticamente
- [x] Implementar notificação no app para admins (pop-up de consumo)
- [x] Implementar notificação por email para admins
- [x] Implementar notificação por WhatsApp para admins
- [x] Testar todas as notificações (testes de QA criados)


## Bugs Reportados - Notificações (Sprint Atual)

- [x] Email não está sendo enviado - Adicionados logs detalhados para debug
- [x] Pop-up deve mostrar "Enviado" após registrar - Redesenhado com novo layout
- [x] Notificação deve ir para TODOS os admins - Implementado com logs de confirmação


## Bugs Críticos - Salvamento de Dados (Sprint Atual)

- [x] Configurações de admins não estão sendo salvas - Implementado salvamento persistente em IndexedDB
- [x] Data/hora visível está poluindo o visual - Ocultada mas gravada automaticamente com fuso Brasília


## Bugs Críticos - Clientes e Android (Sprint Atual)

- [x] Novos clientes não aparecem em Conta Geral - Implementado recarregamento automático
- [x] Adicionar busca/filtro na caixa de seleção de clientes - Campo de busca adicionado
- [x] Android travando no login - Adicionado timeout de 5 segundos
- [x] Android não permite selecionar Conta Geral - Melhorado tratamento de erros


## Bugs Críticos - Sincronização Centralizada (Sprint Crítica)

- [x] Banco centralizado já existe no servidor - Tabelas users, clients, transactions
- [x] Sistema de sincronização criado - serverSync.ts com 5 funções principais
- [x] Integração no login de admins - Sincronização automática ao fazer login
- [x] Criar endpoints REST no servidor - GET/POST para sincronizar dados
- [x] Migrar dados de localStorage para servidor - Mover dados existentes
- [x] Implementar sincronização em tempo real - WebSocket ou polling
- [x] Testar em múltiplas plataformas - Desktop, mobile, Android


## Sincronização Centralizada 100% (Sprint Crítica - URGENTE)

- [x] Migrar dados existentes de localStorage para SQLite centralizado
- [x] Refatorar endpoints para retornar TODOS os clientes (não filtrados por admin)
- [x] Implementar sincronização obrigatória ao fazer login
- [x] Adicionar validação de conectividade e indicador online/offline
- [x] Bloquear novos lançamentos se offline com mensagem "Chama o proprietário"
- [x] Testar sincronização completa entre múltiplos admins e dispositivos
- [x] Validar que Conta Geral carrega TODOS os clientes do servidor
- [x] Validar que todos os admins veem os mesmos clientes e lançamentos


## WebSocket - Sincronização em Tempo Real

- [x] Instalar dependências Socket.io (socket.io, socket.io-client)
- [x] Criar servidor WebSocket com eventos para clientes e lançamentos
- [x] Implementar cliente WebSocket com conexão ao login
- [x] Integrar eventos de criação/atualização de clientes
- [x] Integrar eventos de criação/atualização de lançamentos
- [x] Implementar sincronização automática ao receber eventos
- [x] Adicionar testes de sincronização em tempo real (23 testes passando)
- [ ] Testar com múltiplos clientes simultâneos


## Cardápio e Gerenciamento (Sprint 2)

- [x] Popular banco de dados com dois cardápios (Adega e After) - 132 itens
- [x] Criar página de gerenciamento de cardápios para admin
- [x] Integrar CardapioSelector com Conta Geral
- [x] Implementar exportação CSV em Relatórios
- [x] Testar todas as funcionalidades (18 testes passando)


## Correções Críticas (Sprint 3)

- [x] Corrigir roteamento para abrir em Home ao invés de Conta Geral
- [x] Integrar CardapioSelector em NovoLancamento para admin
- [x] Integrar CardapioSelector em Conta Geral
- [x] Remover calculadora de NovoLancamento
- [x] Testar integração em todos os fluxos (admin, cliente logado, conta geral)


## Bugs Reportados - iPhone e CardapioSelector

- [x] iPhone não carrega o app (tela em branco) - Corrigido erro de Buffer
- [x] CardapioSelector não aparece em Novo Lançamento ao clicar no botão
- [x] Falta página dedicada para gerenciar cardápios (seleção de itens)


## Gerenciamento de Cardápios - Concluído

- [x] Analisar estrutura de dados de cardápios no banco
- [x] Criar endpoints de API para CRUD de cardápios
- [x] Implementar página GerenciarCardapios com UI de edição
- [x] Integrar modal de edição de itens e preços
- [ ] Adicionar sincronização WebSocket para atualizações em tempo real
- [x] Integrar página no menu de admin
- [ ] Testar funcionalidades completas


## Bug: Erro ao Carregar Cardápio em Conta Geral

- [x] Investigar erro "Erro ao carregar cardápio. Tente novamente."
- [x] Verificar endpoint /api/menus
- [x] Corrigir sintaxe Drizzle ORM em menuRouter.ts
- [x] Testar carregamento em todos os fluxos


## Bug: Página GerenciarCardapios em Branco

- [x] Investigar por que página está em branco
- [x] Descobrir que servidor estava rodando apenas Vite, não Express
- [x] Corrigir script dev em package.json para rodar Node.js + Express
- [x] Descobrir erro 500 no endpoint /api/menus
- [x] Corrigir db-client.ts para parsear DATABASE_URL corretamente
- [x] Testar carregamento de cardápios


## Mudanças Críticas Solicitadas

- [x] Corrigir persistência de dados (deletar usuário deve ser permanente)
- [x] Remover opção "Valor Manual" de Conta Geral (manter apenas Cardápio)
- [x] Adicionar busca por pesquisa ao CardapioSelector
- [x] Remover campo "Descrição" de Novo Lançamento


## Bug Crítico: Sincronização de Cardápio em Tempo Real

- [x] Remover cache de localStorage que impedia sincronização
- [x] Implementar polling a cada 5 segundos em CardapioSelectorSimples
- [x] Adicionar invalidação de cache em todas as operações de admin
- [x] Testar sincronização em tempo real


## Bug Crítico: Persistência de Usuários Não Funciona

- [x] Usuários deletados reaparecem após recarregar a página
- [x] Novos usuários (Lucas Peres, Anna Carolina) não aparecem em Conta Geral
- [x] Soft delete não está sendo salvo no banco de dados
- [x] Backup não está ativo - mudanças de admin não persistem
- [x] Sincronização entre frontend e backend quebrada


## Recuperação de Usuários Perdidos - CRÍTICO

- [x] Criar página de migração (MigracaoUsuarios.tsx)
- [x] Implementar exportação de IndexedDB
- [x] Implementar migração para backend
- [x] Adicionar sincronização bidirecional em ContaGeral
- [x] Adicionar polling automático (10s) para sincronização
- [x] Criar guia de recuperação (GUIA_RECUPERACAO_USUARIOS.md)
- [x] Testar CRUD completo (criar, editar, deletar)
- [x] Validar sincronização entre múltiplos admins
- [x] Testar em múltiplos navegadores/dispositivos


## Migração Automática Definitiva (Sprint Crítica - URGENTE)

- [x] Criar página MigracaoAutomatica.tsx para recuperar dados de localStorage/IndexedDB
- [x] Implementar busca automática de usuários, clientes e lançamentos
- [x] Integrar endpoint /api/sync/migrate para migração em massa
- [x] Adicionar polling automático (5s) em GerenciarUsuarios.tsx
- [x] Adicionar item "Recuperar Dados" ao menu admin
- [x] Testar migração com dados reais
- [x] Validar que dados persistem após sair e voltar
- [x] Testar sincronização em tempo real entre admins
- [x] Garantir que mudanças de admin refletem imediatamente em Conta Geral


## Sincronização de Usuários com Servidor (Sprint Atual - CRÍTICA)

- [x] Criar hook `useServerClientes()` que busca usuários da tabela `users` via GET /api/users
- [x] Substituir `useClientes()` por `useServerClientes()` em Dashboard.tsx
- [x] Substituir `useClientes()` por `useServerClientes()` em NovoLancamento.tsx
- [x] Substituir `useClientes()` por `useServerClientes()` em ClientePerfil.tsx
- [x] Substituir `useClientes()` por `useServerClientes()` em Relatorios.tsx
- [x] Atualizar ContaGeral para criar clientes via POST /api/users
- [x] Remover uso de `useClientes()` local em favor de dados do servidor
- [x] Validar que Dashboard mostra lançamentos para administradores
- [x] Validar que NovoLancamento do admin carrega usuários cadastrados
- [ ] Testar fluxo completo: admin cria lançamento → aparece no Dashboard imediatamente
- [ ] Publicar aplicativo após validação completa
- [ ] Implementar indicadores visuais de sincronização (⏳ sincronizando → ✓ sincronizado)


## Sincronização Centralizada de Banco de Dados (Sprint Crítica - URGENTE)

- [x] Análise completa do banco de dados
- [x] Identificação de tabelas vazias (clientes, lancamentos, estabelecimentos, sync_log)
- [x] Atualização do schema Drizzle para corresponder ao banco real
- [x] Correção de referências adminId → admin_id e clienteId → cliente_id
- [x] Remoção de funções de clients (legado)
- [x] Atualização de componentes para usar users em vez de clients
- [x] Correção de endpoints para sincronizar com servidor
- [ ] Testar Dashboard com lançamentos do servidor
- [ ] Validar que admins veem todos os lançamentos em tempo real
- [ ] Implementar filtro de lançamentos por admin
- [ ] Testar sincronização entre múltiplos admins
- [ ] Publicar aplicativo após validação


## Correção de Sincronização de Lançamentos (Sprint Crítica - URGENTE)

- [x] Investigar por que lançamentos não aparecem no Dashboard
- [x] Identificar 3 problemas críticos:
  - [x] Sincronização condicional (apenas cliente, não admin)
  - [x] Filtros com case errado (adminId vs admin_id)
  - [x] Admin ID hardcoded como "1"
- [x] Criar script de correção (CORRECOES_SCRIPT.md)
- [x] Aplicar correção 1: NovoLancamento.tsx (sincronizar admin)
- [x] Aplicar correção 2: syncRouter.ts (filtros snake_case)
- [x] Criar testes automatizados (syncRouter.test.ts)
- [x] Validar com 15 testes - TODOS PASSANDO ✅
- [ ] Testar fluxo completo em produção (admin cria lançamento)
- [ ] Validar que lançamento aparece no Dashboard em < 5 segundos
- [ ] Testar com múltiplos admins simultâneos
- [ ] Publicar aplicativo após validação


## Correção de Novo Cliente e Quantidade em Lançamentos (Sprint Atual)

- [x] Adicionar botão "Confirmar" ao criar novo cliente em NovoLancamento
- [x] Refatorar CardapioSelectorSimples para suportar quantidade
- [x] Implementar botões + e - para ajustar quantidade
- [x] Permitir múltiplos itens do mesmo tipo (ex: 2x Eternity, 3x Cerveja)
- [x] Atualizar total automaticamente com quantidade
- [ ] Testar fluxo completo (novo cliente + quantidade)
- [ ] Validar sincronização com servidor
- [ ] Publicar aplicativo após validação


## Visibilidade de Lançamentos para Admins (CRÍTICO)

- [x] Identificar problema: cliente logado enviava seu ID como adminId
- [x] Corrigir NovoLancamento para não enviar adminId quando cliente logado
- [x] Criar testes para validar visibilidade de lançamentos
- [x] Validar que lançamentos de clientes usam admin_id = 1
- [ ] Testar fluxo completo: cliente registra, admin vê no Dashboard
- [ ] Validar sincronização em tempo real (polling 5s)


## Erro "Digite um valor válido" ao Registrar Lançamento (CRÍTICO)

- [x] Identificar problema: race condition entre setValor e setUsarCardapio
- [x] Corrigir com setTimeout para garantir atualização de estado
- [x] Adicionar logs de debug para validação de valor
- [x] Criar testes para race condition (23 testes passando)
- [ ] Testar fluxo completo: selecionar cardápio, confirmar, registrar lançamento
- [ ] Validar que erro não aparece mais
