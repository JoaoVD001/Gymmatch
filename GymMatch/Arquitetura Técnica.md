# Arquitetura Técnica

## Stack completa

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Framework | TanStack Start | React 19 com SSR nativo, sem Next.js |
| Roteamento | TanStack Router | File-based, type-safe, sem boilerplate |
| Banco | Supabase (PostgreSQL) | BaaS com RLS, Realtime e Storage grátis |
| Auth | Supabase Auth (PKCE) | Fluxo seguro sem expor tokens na URL |
| Realtime | Supabase Realtime | WebSockets gerenciados para o chat |
| Storage | Supabase Storage | Upload de fotos de perfil e chat |
| Deploy | Cloudflare Workers | Edge computing, latência mínima, grátis |
| UI | shadcn/ui + Tailwind v4 | Componentes acessíveis, customizáveis |
| IA | Groq API (Llama 3.1 8B) | Inferência rápida e gratuita |
| Email | Resend API | Entregabilidade superior ao SMTP do Supabase |
| Runtime | Bun | Mais rápido que Node para install e execução |
| Linguagem | TypeScript 5.8 | Type-safety em todo o projeto |

## Estrutura de pastas

```
src/
├── routes/
│   ├── index.tsx                 # Landing page
│   ├── auth.tsx                  # Login / cadastro / reset
│   ├── join.$qrCode.tsx          # Entrada via QR code
│   └── _authenticated/
│       ├── onboarding.tsx        # Configuração inicial
│       ├── chat.$matchId.tsx     # Chat entre matches
│       ├── chat.lucia.tsx        # Chat com a IA
│       ├── _app/
│       │   ├── discover.tsx      # Swipe de perfis
│       │   ├── matches.tsx       # Lista de matches
│       │   ├── me.tsx            # Perfil próprio
│       │   └── premium.tsx       # Planos
│       └── _admin/               # Painel admin
├── components/ui/                # shadcn/ui
├── hooks/useAuth.tsx             # Contexto global de auth
├── integrations/supabase/        # Clientes client e server
└── lib/
    ├── auth-email.ts             # Server functions de email
    ├── lucia.ts                  # Lógica local da Lucia
    ├── lucia-ai.ts               # Server function Groq
    ├── push.ts                   # Web Push
    └── utils.ts                  # cn(), translateError()
```

## Decisões de arquitetura

### Server Functions vs API Routes
O TanStack Start usa `createServerFn` para código que roda apenas no servidor. Usado para:
- Enviar emails (não expõe a chave do Resend no cliente)
- Chamar a Groq API (não expõe a chave no cliente)
- Gerar links de confirmação via Supabase Admin

### Emails direto no Resend
O Supabase Free não permite SMTP customizado, então os emails de confirmação e recuperação de senha são gerados via `supabase.auth.admin.generateLink()` e enviados pelo Resend. Isso dá controle total sobre o template e a entregabilidade.

### Deploy no Cloudflare Workers
O Wrangler compila o app para o runtime de edge do Cloudflare. O resultado é um bundle que roda na borda da rede, com latência muito menor do que um servidor tradicional.

---

*Ver também: [[Banco de Dados]] · [[Emails e Comunicação]] · [[IA — Lucia]]*
