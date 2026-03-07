# Brainstorm de Design - Caderninho Digital

## Contexto
Aplicativo para controle de dívidas e crediário com foco em **agilidade e clareza**. O usuário precisa bater o olho e entender tudo rapidamente, sem fricção.

---

## Ideia 1: Minimalismo Funcional com Tipografia Forte
**Probabilidade: 0.08**

### Design Movement
Modernismo suíço aplicado a interfaces digitais — clareza absoluta através de grid rigoroso, tipografia hierárquica e espaçamento generoso.

### Core Principles
1. **Legibilidade em primeiro lugar**: Cada elemento tem uma razão de ser; nada é decorativo
2. **Hierarquia tipográfica clara**: Títulos em peso pesado (700+), corpo em peso leve (400)
3. **Espaçamento generoso**: Respira; não aglomera informação
4. **Cores semânticas**: Verde para positivo, vermelho para atenção, cinza para neutro

### Color Philosophy
Paleta neutra com acentos semânticos. Fundo branco puro (`#FFFFFF`), texto em cinza escuro (`#1F2937`). Acentos: verde vibrante (`#10B981`) para saldos positivos, vermelho (`#EF4444`) para vencidos, azul (`#3B82F6`) para ações primárias. A cor é funcional, não decorativa.

### Layout Paradigm
**Sidebar esquerda fixa** com navegação principal (Dashboard, Clientes, Relatórios). Conteúdo principal ocupa o resto da tela. Em mobile, sidebar colapsável com ícones. Grid de 12 colunas com padding consistente.

### Signature Elements
1. **Cards com sombra sutil**: Apenas `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` para separação visual
2. **Badges de status**: Pequenos rótulos com cores semânticas (Vencido, Pago, Pendente)
3. **Ícones minimalistas**: Lucide React com peso 2, sem preenchimento

### Interaction Philosophy
Transições suaves (200ms) em hover. Feedback imediato em cliques. Confirmação visual sem modais desnecessários. Botões mudam cor/sombra ao hover, nunca desaparecem.

### Animation
- Hover: `transition: all 200ms ease-out`
- Entrada de página: fade-in suave (300ms)
- Transição entre abas: slide horizontal (250ms)
- Carregamento: spinner simples, sem animações excessivas

### Typography System
- **Display**: Poppins Bold 700, 32px (títulos de página)
- **Heading**: Poppins SemiBold 600, 20px (títulos de seção)
- **Body**: Inter Regular 400, 14px (texto padrão)
- **Small**: Inter Regular 400, 12px (labels, hints)
- **Monospace**: Roboto Mono 400, 13px (valores monetários)

---

## Ideia 2: Design Playful com Micro-interações
**Probabilidade: 0.07**

### Design Movement
Contemporary playful design — cores vibrantes, formas arredondadas, animações delightful. Inspirado em apps como Revolut e Wise.

### Core Principles
1. **Delight em cada interação**: Micro-animações que fazem o usuário sorrir
2. **Cores vibrantes mas harmônicas**: Gradientes suaves, sem agressividade
3. **Formas generosas**: Rounded corners (16-24px), botões grandes e tocáveis
4. **Feedback visual rico**: Toasts animados, confirmações visuais antes de ações

### Color Philosophy
Gradiente primário: azul (`#3B82F6`) para verde (`#10B981`). Secundário: roxo suave (`#8B5CF6`). Fundo: branco com leve tint (`#F9FAFB`). Acentos: laranja (`#F97316`) para chamadas de ação. Emoção positiva através de cores quentes e frias balanceadas.

### Layout Paradigm
**Abordagem card-first**: Tudo é um card com espaçamento generoso. Dashboard com grid 2x2 em desktop, 1x1 em mobile. Sem sidebar fixa; navegação bottom em mobile, top em desktop.

### Signature Elements
1. **Cards com gradiente sutil**: Background com gradiente suave, sombra soft (0 10px 30px rgba(0,0,0,0.08))
2. **Botão flutuante (FAB)**: Grande, com ícone + label, segue o usuário
3. **Animações de entrada**: Cards entram com bounce suave (spring physics)

### Interaction Philosophy
Cada clique tem feedback: ripple effect, cor muda, ícone se anima. Confirmações não são modais chatos, mas toasts com ícone animado. Erros são mensagens amigáveis, não técnicas.

### Animation
- Hover: Scale 1.02 + shadow intensifica (200ms)
- FAB: Rotate 45° ao expandir menu (300ms)
- Confirmação: Checkmark animado com bounce (400ms)
- Transição de página: Fade + slide up (350ms)

### Typography System
- **Display**: Poppins Bold 700, 36px (títulos)
- **Heading**: Poppins SemiBold 600, 22px (subtítulos)
- **Body**: Inter Regular 400, 15px (texto padrão)
- **Small**: Inter Regular 400, 13px (labels)
- **Accent**: Poppins SemiBold 600, 14px (CTAs)

---

## Ideia 3: Design Utilitário com Foco em Velocidade
**Probabilidade: 0.09**

### Design Movement
Brutalism digital — sem ornamentação, máxima funcionalidade, inspirado em ferramentas de produtividade como Notion e Linear. Tipografia como protagonista.

### Core Principles
1. **Velocidade acima de tudo**: Menos cliques, mais atalhos de teclado
2. **Tipografia dominante**: Sem imagens, apenas texto e ícones
3. **Densidade controlada**: Mais informação por tela, mas organizada
4. **Acessibilidade nativa**: Contraste alto, focus states claros

### Color Philosophy
Paleta monocromática com acentos. Fundo: cinza muito claro (`#F3F4F6`). Texto: preto puro (`#000000`). Acentos: azul elétrico (`#0066FF`) para ações, vermelho (`#FF0000`) para alertas. Sem gradientes; cores sólidas apenas.

### Layout Paradigm
**Tabelas e listas como protagonistas**. Dashboard mostra tudo em uma tabela interativa com sorting/filtering. Sem cards; bordas simples separam seções. Sidebar com atalhos de teclado listados.

### Signature Elements
1. **Tabelas com hover row**: Linha inteira muda de cor ao passar mouse
2. **Atalhos de teclado**: Cmd+K abre command palette
3. **Badges inline**: Status como badges simples sem arredondamento

### Interaction Philosophy
Tudo é clicável ou tem atalho. Sem animações desnecessárias; transições são instantâneas ou muito rápidas (100ms). Feedback é textual e visual simultaneamente.

### Animation
- Transição: Nenhuma (instantânea)
- Hover: Background muda (100ms)
- Focus: Outline 2px em azul
- Carregamento: Skeleton screens, sem spinners

### Typography System
- **Display**: IBM Plex Mono Bold 700, 28px (títulos)
- **Heading**: IBM Plex Mono SemiBold 600, 18px (subtítulos)
- **Body**: IBM Plex Mono Regular 400, 13px (texto padrão)
- **Small**: IBM Plex Mono Regular 400, 11px (labels)
- **Monospace**: IBM Plex Mono Regular 400, 12px (valores)

---

## Decisão Final

**Escolhida: Ideia 1 - Minimalismo Funcional com Tipografia Forte**

Esta abordagem alinha-se perfeitamente com o requisito de **agilidade e clareza**. A hierarquia tipográfica forte garante que o usuário entenda a informação em milissegundos. O layout com sidebar oferece navegação clara sem distrações. As cores semânticas (verde/vermelho) comunicam status instantaneamente. Não há "ruído visual" que desacelere a compreensão.

### Justificativa
- **Agilidade**: Sem animações excessivas, sem micro-interações que distraem. Tudo é direto.
- **Clareza**: Tipografia hierárquica + cores semânticas + espaçamento generoso = compreensão imediata.
- **Profissionalismo**: Aparência confiável para um app de controle financeiro.
- **Escalabilidade**: Fácil adicionar novas funcionalidades sem quebrar o design.
