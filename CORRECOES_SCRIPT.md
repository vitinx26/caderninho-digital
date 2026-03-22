# 🔧 Script de Correção: Sincronização e Filtros

## Resumo das Correções

Este script corrige os 3 problemas críticos que impedem lançamentos de aparecerem no Dashboard:

| Problema | Arquivo | Linhas | Status |
|---|---|---|---|
| Sincronização condicional | NovoLancamento.tsx | 138 | ❌ → ✅ |
| Filtros case errado | syncRouter.ts | 127, 178, 186 | ❌ → ✅ |
| Admin ID hardcoded | syncRouter.ts | 421 | ❌ → ✅ |

---

## Correção 1: NovoLancamento.tsx - Sincronizar Admin

### ❌ ANTES (Linha 138)
```typescript
// Sincronizar com servidor se usuário está logado (cliente)
if (usuarioLogado && usuarioLogado.tipo === 'cliente') {
  try {
    console.log('📤 Sincronizando lançamento com servidor...');
    const response = await fetch('/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: clienteIdFixo || clienteSelecionado,
        tipo,
        valor: Math.round(parseFloat(valor) * 100),
        descricao: descricao.trim(),
        data: obterTimestampBrasilia(),
      }),
    });
```

### ✅ DEPOIS (Linha 138)
```typescript
// Sincronizar com servidor se usuário está logado (admin ou cliente)
if (usuarioLogado && (usuarioLogado.tipo === 'cliente' || usuarioLogado.tipo === 'admin')) {
  try {
    console.log('📤 Sincronizando lançamento com servidor...');
    const response = await fetch('/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId: clienteIdFixo || clienteSelecionado,
        tipo,
        valor: Math.round(parseFloat(valor) * 100),
        descricao: descricao.trim(),
        data: obterTimestampBrasilia(),
        adminId: usuarioLogado.id, // ✅ Enviar ID do admin autenticado
      }),
    });
```

**Mudanças**:
- Linha 138: Adicionar `|| usuarioLogado.tipo === 'admin'`
- Linha 150: Adicionar `adminId: usuarioLogado.id`

---

## Correção 2: syncRouter.ts - Filtros com Snake Case

### ❌ ANTES (Linha 127)
```typescript
// Filtrar por admin se especificado
if (adminId) {
  clientes = clientes.filter((c: any) => c.adminId === adminId);
}
```

### ✅ DEPOIS (Linha 127)
```typescript
// Filtrar por admin se especificado
if (adminId) {
  clientes = clientes.filter((c: any) => c.admin_id === adminId);
}
```

**Mudança**: `c.adminId` → `c.admin_id`

---

### ❌ ANTES (Linha 178)
```typescript
// Filtrar por admin se especificado
if (adminId) {
  transacoes = transacoes.filter((t: any) => t.adminId === adminId);
}
```

### ✅ DEPOIS (Linha 178)
```typescript
// Filtrar por admin se especificado
if (adminId) {
  transacoes = transacoes.filter((t: any) => t.admin_id === adminId);
}
```

**Mudança**: `t.adminId` → `t.admin_id`

---

### ❌ ANTES (Linha 186)
```typescript
// Filtrar por cliente
if (clienteId) {
  transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.clienteId === clienteId);
}
```

### ✅ DEPOIS (Linha 186)
```typescript
// Filtrar por cliente
if (clienteId) {
  transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.cliente_id === clienteId);
}
```

**Mudança**: `t.clienteId` → `t.cliente_id`

---

## Correção 3: syncRouter.ts - Admin ID do Usuário Autenticado

### ❌ ANTES (Linha 421)
```typescript
const novoLancamento = await dbHelpers.createTransaction({
  id: nanoid(),
  admin_id: String(adminId || 1), // ❌ Hardcoded como 1
  cliente_id: String(clienteId),
  tipo,
  valor: valorEmCentavos,
  descricao: descricao || '',
  data: data || Date.now(),
  dataCriacao: Date.now(),
  dataAtualizacao: Date.now(),
});
```

### ✅ DEPOIS (Linha 421)
```typescript
const novoLancamento = await dbHelpers.createTransaction({
  id: nanoid(),
  admin_id: String(adminId || 1), // ✅ Mantém padrão 1 se não fornecido
  cliente_id: String(clienteId),
  tipo,
  valor: valorEmCentavos,
  descricao: descricao || '',
  data: data || Date.now(),
  dataCriacao: Date.now(),
  dataAtualizacao: Date.now(),
});
```

**Nota**: Esta linha está correta. O problema é que `adminId` não é fornecido pelo frontend. A correção anterior (adicionar `adminId: usuarioLogado.id` no NovoLancamento.tsx) resolve isso.

---

## Aplicar Correções Manualmente

### Passo 1: Corrigir NovoLancamento.tsx

**Arquivo**: `client/src/pages/NovoLancamento.tsx`

Encontre a linha 138:
```typescript
if (usuarioLogado && usuarioLogado.tipo === 'cliente') {
```

Substitua por:
```typescript
if (usuarioLogado && (usuarioLogado.tipo === 'cliente' || usuarioLogado.tipo === 'admin')) {
```

Encontre a linha 150 (dentro do fetch):
```typescript
body: JSON.stringify({
  clienteId: clienteIdFixo || clienteSelecionado,
  tipo,
  valor: Math.round(parseFloat(valor) * 100),
  descricao: descricao.trim(),
  data: obterTimestampBrasilia(),
}),
```

Substitua por:
```typescript
body: JSON.stringify({
  clienteId: clienteIdFixo || clienteSelecionado,
  tipo,
  valor: Math.round(parseFloat(valor) * 100),
  descricao: descricao.trim(),
  data: obterTimestampBrasilia(),
  adminId: usuarioLogado.id, // ✅ Novo
}),
```

---

### Passo 2: Corrigir syncRouter.ts

**Arquivo**: `server/syncRouter.ts`

**Correção 1 - Linha 127**:
```typescript
// ANTES
clientes = clientes.filter((c: any) => c.adminId === adminId);

// DEPOIS
clientes = clientes.filter((c: any) => c.admin_id === adminId);
```

**Correção 2 - Linha 178**:
```typescript
// ANTES
transacoes = transacoes.filter((t: any) => t.adminId === adminId);

// DEPOIS
transacoes = transacoes.filter((t: any) => t.admin_id === adminId);
```

**Correção 3 - Linha 186**:
```typescript
// ANTES
transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.clienteId === clienteId);

// DEPOIS
transacoesFiltradas = transacoesFiltradas.filter((t: any) => t.cliente_id === clienteId);
```

---

## Validação das Correções

### ✅ Teste 1: Admin Cria Lançamento
1. Fazer login como admin
2. Clicar em "Novo Lançamento"
3. Preencher dados e confirmar
4. Verificar se aparece no Dashboard em < 5 segundos

**Esperado**: Lançamento aparece no Dashboard ✅

### ✅ Teste 2: Cliente Cria Lançamento
1. Fazer login como cliente
2. Clicar em "Novo Lançamento"
3. Preencher dados e confirmar
4. Verificar se aparece no Dashboard em < 5 segundos

**Esperado**: Lançamento aparece no Dashboard ✅

### ✅ Teste 3: Filtros Funcionam
1. GET /api/transactions?adminId=1
2. Verificar se retorna apenas transações do admin 1

**Esperado**: Filtro funciona corretamente ✅

### ✅ Teste 4: Admin ID Correto
1. Admin cria lançamento
2. Verificar no banco se `admin_id` = ID do admin (não 1)

**Esperado**: Admin ID é do usuário autenticado ✅

---

## Impacto das Correções

### Antes
```
Admin cria lançamento
  ↓
❌ Não sincroniza com servidor
  ↓
❌ Não aparece no Dashboard
```

### Depois
```
Admin cria lançamento
  ↓
✅ Sincroniza com servidor (POST /api/lancamentos)
  ↓
✅ Aparece no Dashboard em < 5 segundos
```

---

## Rollback (Se Necessário)

Se precisar reverter as mudanças:

### NovoLancamento.tsx
```typescript
// Reverter para:
if (usuarioLogado && usuarioLogado.tipo === 'cliente') {
  // Remover adminId do body
}
```

### syncRouter.ts
```typescript
// Reverter para:
c.adminId, t.adminId, t.clienteId
```

---

## Próximos Passos

1. ✅ Aplicar as 3 correções
2. ✅ Testar fluxo completo (admin + cliente)
3. ✅ Validar que lançamentos aparecem em tempo real
4. ✅ Salvar checkpoint
5. ✅ Publicar aplicativo

---

## Checklist de Aplicação

- [ ] Correção 1: NovoLancamento.tsx linha 138 ✅
- [ ] Correção 1: NovoLancamento.tsx linha 150 ✅
- [ ] Correção 2: syncRouter.ts linha 127 ✅
- [ ] Correção 2: syncRouter.ts linha 178 ✅
- [ ] Correção 2: syncRouter.ts linha 186 ✅
- [ ] Teste 1: Admin cria lançamento ✅
- [ ] Teste 2: Cliente cria lançamento ✅
- [ ] Teste 3: Filtros funcionam ✅
- [ ] Teste 4: Admin ID correto ✅
- [ ] Salvar checkpoint ✅
- [ ] Publicar aplicativo ✅
