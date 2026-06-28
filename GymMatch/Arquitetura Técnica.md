# Arquitetura Técnica

## Stack completa

| Camada | Tecnologia | Por quê |
|--------|-----------|---------|
| Framework | TanStack Start | React 19 com SSR nativo, sem Next.js |
| Roteamento | TanStack Router | File-based, type-safe, sem boilerplate |
| Banco | Supabase (PostgreSQL) | BaaS com RLS, Realtime e Storage grátis |
| Auth | Supabase Auth (PKCE) | Fluxo seguro sem expor tokens na URL |
| Email | Supabase Auth nativo | Sem dependência externa — zero config |
| Realtime | Supabase Realtime | WebSockets gerenciados para o chat |
| Storage | Supabase Storage | Upload de fotos de perfil e chat |
| Pagamento | Stripe (REST API via fetch) | Checkout hospedado, cartão + Pix |
| Deploy | Cloudflare Workers | Edge computing, latência mínima, grátis |
| UI | shadcn/ui + Tailwind v4 | Componentes acessíveis, customizáveis |
| IA | Groq API (Llama 3.1 8B) | Inferência rápida e gratuita |
| Push | Web Push API + VAPID + Supabase Edge Functions | Notificações reais no celular mesmo com app fechado |
| Cron | pg_cron (Supabase) | Lembretes automáticos de treino a cada 15min |
| Runtime | Bun | Mais rápido que Node para install e execução |
| Linguagem | TypeScript 5.8 | Type-safety em todo o projeto |

## Estrutura de pastas

```
src/
├── routes/
│   ├── index.tsx                    # Landing page
│   ├── auth.tsx                     # Login / cadastro / reset de senha
│   ├── join.$qrCode.tsx             # Entrada via QR code
│   └── _authenticated/
│       ├── onboarding.tsx           # Configuração inicial do perfil
│       ├── chat.$matchId.tsx        # Chat entre matches
│       ├── chat.lucia.tsx           # Chat com a IA Lucia
│       ├── _app/
│       │   ├── discover.tsx         # Swipe de perfis
│       │   ├── matches.tsx          # Lista de matches
│       │   ├── me.tsx               # Perfil próprio (estilo Instagram)
│       │   ├── profile.edit.tsx     # Edição de perfil e fotos
│       │   ├── treino.tsx           # Plano semanal + convites de treino
│       │   ├── premium.tsx          # Tela de planos
│       │   ├── payment.tsx          # Checkout Stripe
│       │   └── payment_.success.tsx # Sucesso pós-pagamento
│       └── _admin/                  # Painel administrativo
├── components/
│   ├── BottomNav.tsx                # Nav pill flutuante
│   └── ui/                         # shadcn/ui
├── hooks/useAuth.tsx                # Contexto global de auth + perfil
├── integrations/supabase/           # Clientes client e server
└── lib/
    ├── stripe.ts                    # Server functions de checkout
    ├── lucia.ts                     # Lógica local da Lucia (swipe hint)
    ├── lucia-ai.ts                  # Server function Groq API
    ├── push.ts                      # Web Push: registerSW, subscribePush, fireLuciaPush
    └── utils.ts                     # cn(), translateError()
supabase/
├── functions/
│   ├── send-push/index.ts           # Edge Function: envia push via web-push + VAPID
│   └── workout-reminders/index.ts   # Edge Function: lembretes automáticos (chamada via pg_cron)
└── migrations/
    └── 20260627_push_and_invites.sql # push_subscriptions + workout_invites + RLS
```

## Decisões de arquitetura

### Server Functions vs API Routes
O TanStack Start usa `createServerFn` para código que roda apenas no servidor. Usado para:
- Criar sessões de checkout no Stripe (não expõe `STRIPE_SECRET_KEY` no cliente)
- Ativar planos após pagamento (usa `supabaseAdmin` com service role)
- Chamar a Groq API (não expõe a chave no cliente)

### Stripe via fetch (sem SDK)
O pacote `stripe` npm é incompatível com o runtime de edge do Cloudflare Workers. Por isso, todas as chamadas ao Stripe usam `fetch` direto na REST API (`https://api.stripe.com/v1/...`) com `URLSearchParams` no body.

### RLS e funções SECURITY DEFINER
Algumas políticas RLS precisam consultar outras tabelas sem sofrer restrições de RLS delas. Para isso, usamos funções com `SECURITY DEFINER`:
- `check_same_gym(viewer_id, profile_id)` — verifica se dois usuários compartilham uma academia, bypassa o RLS de `user_gyms`
- `handle_swipe(from_user, to_user, swipe_action)` — registra swipe, aplica limites por plano e verifica match

### Email nativo do Supabase
Não há serviço externo de email. O Supabase Auth gerencia todos os emails de confirmação e recuperação de senha. Templates configurados em Authentication → Email Templates no dashboard.

### Deploy no Cloudflare Workers
O Wrangler compila o app para o runtime de edge do Cloudflare. O resultado é um bundle que roda na borda da rede, com latência mínima. Atenção: o runtime não suporta Node APIs nem pacotes que dependem delas (como o SDK do Stripe).

---

*Ver também: [[Banco de Dados]] · [[Emails e Comunicação]] · [[IA — Lucia]] · [[Planos e Monetização]]*
