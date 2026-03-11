# Caderninho Digital - TODO

## Funcionalidades Implementadas

### MVP Core
- [x] Dashboard com lista de clientes e saldos
- [x] Perfil do cliente com histórico de transações
- [x] Novo lançamento (débito/pagamento)
- [x] Relatórios com resumo financeiro
- [x] Configurações do app
- [x] Conta geral (sem login)

### Autenticação e Acesso
- [x] Login de admin
- [x] Login de cliente
- [x] Acesso geral sem login
- [x] Proteção de registro de admin

### Dados e Persistência
- [x] IndexedDB para armazenamento offline
- [x] localStorage para sessão
- [x] Sincronização entre abas
- [x] Backup automático
- [x] Importação/exportação de backup

### PWA e Mobile
- [x] Service Worker registrado
- [x] Manifest.json configurado
- [x] Botão de instalação do app
- [x] Funcionamento offline completo

### Integração WhatsApp
- [x] Número do WhatsApp do admin nas configurações
- [x] Botão de envio de mensagem via WhatsApp
- [x] Mensagem automática de cobrança

### Múltiplos Estabelecimentos
- [x] Campo de nome do estabelecimento no cadastro
- [x] Exibição do nome no Dashboard
- [x] Edição do nome nas Configurações
- [x] Isolamento de dados por admin

## Correções e Melhorias

### Data Recovery (CRÍTICO - RESOLVIDO)
- [x] Função robusta de migração de dados (`migrateAllOldData`)
- [x] Suporte para múltiplas chaves de localStorage
- [x] Suporte para IndexedDB versões 1, 2, 3
- [x] Normalização de dados antigos
- [x] Logging detalhado de migração
- [x] Integração automática no App.tsx
- [x] Botão manual "Recuperar Dados Antigos" nas Configurações
- [x] Testes unitários para migração

### Bugs Corrigidos
- [x] Usuário não conseguia fazer login novamente após logout
- [x] Clientes não eram salvos corretamente no IndexedDB
- [x] Dashboard não sincronizava com Conta Geral
- [x] React #310 error no ErrorBoundary

## Próximas Melhorias (Backlog)

- [ ] Sincronização com backend (quando implementado)
- [ ] Suporte para múltiplos idiomas
- [ ] Tema escuro
- [ ] Notificações push
- [ ] Integração com SMS
- [ ] Relatórios avançados com gráficos
- [ ] Categorização de produtos
- [ ] Histórico de alterações
- [ ] Autenticação biométrica
