

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
