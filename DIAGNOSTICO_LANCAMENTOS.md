# 🔍 Diagnóstico: Por que Lançamentos Não Aparecem no Dashboard

## Resumo Executivo
Novos lançamentos criados por administradores **NÃO são sincronizados com o servidor**, permanecendo apenas no IndexedDB local. Por isso não aparecem no Dashboard, que busca dados do servidor.

---

## 1. Fluxo de Dados Atual

### ✅ Fluxo Correto (Cliente Logado)
```
Cliente Logado → NovoLancamento.tsx
  ↓
Linha 138: if (usuarioLogado.tipo === 'cliente')
  ↓
POST /api/lancamentos (linha 141)
  ↓
Banco de Dados ✅
  ↓
Dashboard busca GET /api/transactions ✅
  ↓
Lançamento aparece no Dashboard ✅
```

### ❌ Fluxo Errado (Admin)
```
Admin → NovoLancamento.tsx
  ↓
Linha 129: adicionarLancamento() → IndexedDB local
  ↓
Linha 138: if (usuarioLogado.tipo === 'cliente') ← FALSO
  ↓
❌ POST /api/lancamentos NÃO é chamado
  ↓
Lançamento fica apenas no IndexedDB local ❌
  ↓
Dashboard busca GET /api/transactions
  ↓
❌ Lançamento não aparece no Dashboard ❌
```

---

## 2. Problemas Identificados

### Problema 1: Sincronização Condicional (CRÍTICO)
**Arquivo**: `client/src/pages/NovoLancamento.tsx`
**Linha**: 138

```typescript
// ❌ ERRADO: Apenas cliente logado sincroniza
if (usuarioLogado && usuarioLogado.tipo === 'cliente') {
  // Sincronizar com servidor
}
```

**Impacto**: Admin cria lançamento mas não sincroniza com servidor

---

### Problema 2: Filtros com Case Errado
**Arquivo**: `server/syncRouter.ts`
**Linhas**: 127, 178, 186

```typescript
// ❌ ERRADO: Usando camelCase em vez de snake_case
transacoes.filter((t: any) => t.adminId === adminId)   // Linha 178
transacoes.filter((t: any) => t.clienteId === clienteId) // Linha 186
clientes.filter((c: any) => c.adminId === adminId)      // Linha 127
```

**Banco Real**: `admin_id`, `cliente_id`

**Impacto**: Filtros nunca funcionam porque campos não existem com esses nomes

---

### Problema 3: Admin ID Hardcoded
**Arquivo**: `server/syncRouter.ts`
**Linha**: 421

```typescript
admin_id: String(adminId || 1), // ❌ Padrão é 1 quando não fornecido
```

**Impacto**: Todos os lançamentos aparecem com admin_id = "1"

---

## 3. Dados no Banco

### Últimas Transações
```
ID: jjjF6GwMXH6n3tCozy_pQ
admin_id: "1"
cliente_id: "30016"
tipo: "debito"
valor: "500000" (R$ 5.000,00)
descricao: "Teste"
data: 2026-03-22 05:20:34 ✅ Data recente
```

**Conclusão**: Lançamentos **ESTÃO** no banco, mas:
- ✅ Foram criados via POST /api/lancamentos
- ❌ Não aparecem no Dashboard
- ❌ Provavelmente criados por cliente logado, não por admin

---

## 4. Fluxo do Dashboard

### Dashboard.tsx (Linhas 20-24)
```typescript
const { clientes } = useServerClientes();           // GET /api/users
const { lancamentos } = useServerTransactions();    // GET /api/transactions
const saldos = useSaldos(clientes, lancamentos);   // Calcula saldos
```

### useServerTransactions.ts (Linha 17)
```typescript
const response = await fetch('/api/transactions');
```

### GET /api/transactions (syncRouter.ts, Linha 167)
```typescript
// Retorna TODAS as transações
let transacoes = await dbHelpers.getAllTransactions();
```

**Problema**: Endpoint retorna dados corretos, mas Dashboard não mostra porque:
1. ❌ Filtros com case errado nunca funcionam
2. ❌ Admin não sincroniza lançamentos

---

## 5. Checklist de Verificação

### ✅ Verificado
- [x] Banco de dados tem 18 transações
- [x] Endpoint GET /api/transactions retorna dados
- [x] Hook useServerTransactions busca dados
- [x] Dashboard usa o hook
- [x] Polling a cada 5 segundos funciona

### ❌ Problemas Encontrados
- [ ] Admin não sincroniza lançamentos com servidor
- [ ] Filtros com case errado (adminId vs admin_id)
- [ ] Admin ID hardcoded como "1"
- [ ] Lançamentos de admin ficam apenas no IndexedDB

---

## 6. Fluxo Esperado (CORRETO)

```
Admin → NovoLancamento.tsx
  ↓
Lançamento criado localmente (IndexedDB)
  ↓
✅ POST /api/lancamentos (com admin_id do usuário logado)
  ↓
Banco de Dados
  ↓
Dashboard busca GET /api/transactions
  ↓
✅ Lançamento aparece no Dashboard
  ↓
Polling a cada 5 segundos mantém sincronizado
```

---

## 7. Recomendações

### Correção 1: Sincronizar Admin
**Arquivo**: `client/src/pages/NovoLancamento.tsx`
**Linha**: 138

```typescript
// ✅ CORRETO: Sincronizar para admin E cliente logado
if (usuarioLogado && (usuarioLogado.tipo === 'cliente' || usuarioLogado.tipo === 'admin')) {
  // Sincronizar com servidor
}
```

### Correção 2: Corrigir Case dos Filtros
**Arquivo**: `server/syncRouter.ts`
**Linhas**: 127, 178, 186

```typescript
// ✅ CORRETO: Usar snake_case
transacoes.filter((t: any) => t.admin_id === adminId)
transacoes.filter((t: any) => t.cliente_id === clienteId)
clientes.filter((c: any) => c.admin_id === adminId)
```

### Correção 3: Usar Admin ID do Usuário Autenticado
**Arquivo**: `server/syncRouter.ts`
**Linha**: 421

```typescript
// ✅ CORRETO: Usar ID do admin autenticado
admin_id: String(adminId || ctx.user?.id || 1),
```

---

## 8. Impacto das Correções

### Antes
- ❌ Admin cria lançamento → Não aparece no Dashboard
- ❌ Cliente vê lançamento → Aparece no Dashboard
- ❌ Inconsistência de dados entre admin e cliente

### Depois
- ✅ Admin cria lançamento → Aparece no Dashboard em tempo real
- ✅ Cliente cria lançamento → Aparece no Dashboard em tempo real
- ✅ Todos veem os mesmos dados sincronizados

---

## 9. Testes Recomendados

1. **Teste 1**: Admin cria lançamento → Deve aparecer no Dashboard em < 5 segundos
2. **Teste 2**: Cliente cria lançamento → Deve aparecer no Dashboard em < 5 segundos
3. **Teste 3**: Múltiplos admins simultâneos → Dados devem estar sincronizados
4. **Teste 4**: Filtros por admin → Devem funcionar corretamente
