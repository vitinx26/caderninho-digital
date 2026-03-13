# Plano de Testes A/B e Q/A - Caderninho Digital

## 1. Testes de Login e Autenticação

### 1.1 Login com Usuário Admin
- [ ] Fazer login com email: victorhgs26@gmail.com
- [ ] Verificar se acesso ao Dashboard é concedido
- [ ] Verificar se acesso a Configurações é permitido
- [ ] Verificar se acesso a Gerenciamento de Admins é visível

### 1.2 Login com Usuário Cliente
- [ ] Fazer login com email de cliente
- [ ] Verificar se Dashboard mostra apenas dados do cliente
- [ ] Verificar se Configurações não mostra opção de Gerenciamento de Admins
- [ ] Verificar se acesso a Relatorios é permitido

### 1.3 Conta Geral (Sem Login)
- [ ] Clicar em "Conta Geral (Compras Rápidas)"
- [ ] Verificar se nome do estabelecimento é exibido corretamente
- [ ] Verificar se é possível registrar compras sem login
- [ ] Verificar se estabelecimento está identificado em cada compra

### 1.4 Registro de Novo Usuário
- [ ] Preencher formulário de registro
- [ ] Verificar se telefone é obrigatório
- [ ] Tentar registrar sem telefone - deve exibir erro
- [ ] Registrar com telefone válido - deve funcionar

## 2. Testes de Funcionalidades Principais

### 2.1 Novo Lançamento
- [ ] Criar novo lançamento como admin
- [ ] Verificar se data é registrada corretamente
- [ ] Verificar se valor é salvo corretamente
- [ ] Verificar se descrição é salva
- [ ] Verificar se cliente é associado corretamente

### 2.2 Cobrança via WhatsApp
- [ ] Editar template de mensagem nas Configurações
- [ ] Registrar novo débito
- [ ] Clicar em botão "Enviar WhatsApp"
- [ ] Verificar se mensagem usa template personalizado
- [ ] Verificar se variáveis {cliente}, {valor}, {data} são substituídas

### 2.3 Recuperação de Dados Antigos
- [ ] Limpar localStorage (F12 > Application > Clear Storage)
- [ ] Recarregar página
- [ ] Verificar se dados antigos são recuperados automaticamente
- [ ] Verificar se sincronização com backend ocorre
- [ ] Verificar se usuário victorhgs26@gmail.com é encontrado

### 2.4 Gerenciamento de Admins
- [ ] Fazer login como admin
- [ ] Ir para Configurações
- [ ] Procurar seção de "Gerenciamento de Admins"
- [ ] Criar novo admin
- [ ] Verificar se novo admin consegue fazer login
- [ ] Verificar se novo admin tem acesso a Configurações

## 3. Testes de Validação de Dados

### 3.1 Telefone Obrigatório
- [ ] Tentar registrar usuário sem telefone - deve falhar
- [ ] Registrar com telefone - deve funcionar
- [ ] Verificar se telefone é salvo corretamente
- [ ] Verificar se telefone é usado para cobranças WhatsApp

### 3.2 Identificação de Estabelecimento
- [ ] Em Conta Geral, verificar se estabelecimento é exibido
- [ ] Registrar compra em Conta Geral
- [ ] Verificar se compra está associada ao estabelecimento correto
- [ ] Verificar se não há duplicidade de cadastro para outro estabelecimento

### 3.3 Integridade de Dados
- [ ] Criar múltiplos lançamentos
- [ ] Verificar se todos aparecem no histórico
- [ ] Verificar se totais são calculados corretamente
- [ ] Verificar se dados persistem após recarregar página

## 4. Testes de Performance e Compatibilidade

### 4.1 Navegadores
- [ ] Testar em Chrome
- [ ] Testar em Firefox
- [ ] Testar em Safari
- [ ] Testar em navegação privada

### 4.2 Dispositivos
- [ ] Testar em desktop (1920x1080)
- [ ] Testar em tablet (768x1024)
- [ ] Testar em mobile (375x667)
- [ ] Verificar responsividade em todos os tamanhos

### 4.3 Velocidade
- [ ] Medir tempo de carregamento da página
- [ ] Medir tempo de login
- [ ] Medir tempo de registro de lançamento
- [ ] Medir tempo de sincronização com backend

## 5. Testes de Segurança

### 5.1 Autenticação
- [ ] Verificar se senha incorreta rejeita login
- [ ] Verificar se sessão expira após inatividade
- [ ] Verificar se logout funciona corretamente
- [ ] Verificar se usuário não logado não acessa dados privados

### 5.2 Autorização
- [ ] Verificar se cliente não acessa dados de outro cliente
- [ ] Verificar se usuário não admin não acessa Configurações
- [ ] Verificar se usuário não admin não consegue criar outro admin
- [ ] Verificar se dados são isolados por usuário

## 6. Testes de Casos Extremos

### 6.1 Valores Extremos
- [ ] Registrar lançamento com valor muito grande (999999.99)
- [ ] Registrar lançamento com valor muito pequeno (0.01)
- [ ] Registrar lançamento com valor negativo (deve falhar ou ser tratado)
- [ ] Registrar lançamento com valor zero (deve falhar ou ser tratado)

### 6.2 Caracteres Especiais
- [ ] Registrar cliente com nome contendo acentos (José, São Paulo)
- [ ] Registrar cliente com nome contendo números (Cliente 123)
- [ ] Registrar cliente com nome contendo símbolos (Cliente & Cia)
- [ ] Registrar descrição com emojis

### 6.3 Dados Faltantes
- [ ] Tentar registrar lançamento sem cliente (deve falhar)
- [ ] Tentar registrar lançamento sem valor (deve falhar)
- [ ] Tentar registrar lançamento sem data (deve usar data atual)
- [ ] Tentar registrar lançamento sem descrição (deve permitir)

## 7. Testes de Fluxo Completo

### 7.1 Fluxo Admin
1. [ ] Login como admin
2. [ ] Criar novo cliente
3. [ ] Registrar débito para cliente
4. [ ] Enviar cobrança via WhatsApp
5. [ ] Visualizar relatório
6. [ ] Logout

### 7.2 Fluxo Cliente
1. [ ] Login como cliente
2. [ ] Visualizar seus débitos
3. [ ] Visualizar relatório pessoal
4. [ ] Logout

### 7.3 Fluxo Conta Geral
1. [ ] Clicar em "Conta Geral"
2. [ ] Criar novo cliente rápido
3. [ ] Registrar compra
4. [ ] Visualizar histórico
5. [ ] Logout

## Resultado Final

- [ ] Todos os testes passaram
- [ ] Nenhum erro encontrado
- [ ] Aplicação pronta para produção
- [ ] Documentação atualizada
