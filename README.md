<div align="center">

# 🏋️ GymMatch

**Encontre sua galera da academia — parceiros de treino, amizades ou algo mais.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

[Demo ao vivo](#) · [Reportar bug](mailto:suporte@gymmatch.app)

</div>

---

## Sobre o projeto

GymMatch é uma plataforma social que conecta pessoas que frequentam a **mesma academia**. Funciona como um app de matchmaking — usuários entram via QR code da academia, montam seu perfil de treino e começam a dar match com quem treina no mesmo espaço.

Construído com foco em **mobile-first**, **performance de edge** e **funcionalidades em tempo real**.

---

## Funcionalidades

### Para o usuário
- **Entrada via QR code** — cada academia tem seu próprio QR para o usuário entrar na comunidade
- **Swipe de perfis** — descoberta estilo Tinder com suporte a gestos touch
- **Sistema de match mútuo** — match criado automaticamente via trigger no banco
- **Chat em tempo real** — mensagens instantâneas com Supabase Realtime
- **Envio de fotos no chat** — disponível nos planos Gold e Diamond
- **Lucia (IA integrada)** — assistente virtual com memória de conversa, respostas via Groq API e push notifications por inatividade
- **Planos de assinatura** — Free / Gold / Diamond com benefícios progressivos
- **Bloqueio e denúncia** — segurança diretamente pelo chat

### Painel Admin
- Gestão completa de usuários, academias e denúncias
- Criação de anúncios por academia
- Dashboard com analytics
- Suspensão de contas e moderação

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) — React 19 com SSR |
| Roteamento | [TanStack Router](https://tanstack.com/router) — file-based |
| Banco de dados | [Supabase](https://supabase.com) — PostgreSQL + RLS |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| Deploy | [Cloudflare Workers](https://workers.cloudflare.com) |
| UI | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) |
| IA | [Groq API](https://groq.com) — Llama 3.1 8B |
| Email | [Resend](https://resend.com) |
| Package manager | [Bun](https://bun.sh) |
| Linguagem | TypeScript 5.8 |

---

## Banco de dados

Todo o schema está em [`supabase/setup_all.sql`](supabase/setup_all.sql) e pode ser executado com um único comando no SQL Editor do Supabase.

```
profiles            — perfis vinculados ao auth.users
gyms                — academias cadastradas
user_gyms           — relação usuário ↔ academia
likes               — curtidas entre usuários
matches             — matches mútuos (gerados por trigger automático)
messages            — mensagens do chat
blocks              — bloqueios
reports             — denúncias
announcements       — comunicados por academia
subscription_plans  — planos Free / Gold / Diamond
subscriptions       — integração Stripe
audit_logs          — log de ações admin
```

Segurança garantida 100% via **Row Level Security (RLS)** — cada usuário acessa apenas os próprios dados.

---

## Como rodar localmente

### Pré-requisitos

- [Bun](https://bun.sh)
- Conta gratuita no [Supabase](https://supabase.com)
- Conta gratuita no [Resend](https://resend.com)
- Conta gratuita no [Groq](https://console.groq.com)

### 1. Clone e instale

```bash
git clone https://github.com/JoaoVD001/gymmatch.git
cd gymmatch
bun install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com suas chaves (veja `.env.example` para referência).

### 3. Configure o banco de dados

No Supabase → **SQL Editor**, execute o conteúdo de `supabase/setup_all.sql`.

### 4. Configure os redirects de auth

No Supabase → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/**`

### 5. Rode

```bash
bun dev
```

Acesse `http://localhost:3000`

---

## Estrutura do projeto

```
src/
├── routes/
│   ├── index.tsx                      # Landing page
│   ├── auth.tsx                       # Login, cadastro e redefinição de senha
│   ├── join.$qrCode.tsx               # Entrada via QR code
│   └── _authenticated/
│       ├── onboarding.tsx             # Configuração inicial do perfil
│       ├── chat.$matchId.tsx          # Chat entre matches
│       ├── chat.lucia.tsx             # Chat com a IA Lucia
│       ├── _app/
│       │   ├── discover.tsx           # Swipe de perfis
│       │   ├── matches.tsx            # Lista de matches
│       │   ├── me.tsx                 # Perfil do usuário
│       │   └── premium.tsx            # Planos de assinatura
│       └── _admin/
│           ├── admin.users.tsx
│           ├── admin.gyms.tsx
│           ├── admin.reports.tsx
│           └── admin.announcements.tsx
├── components/ui/                     # Componentes shadcn/ui
├── hooks/useAuth.tsx                  # Contexto de autenticação
├── integrations/supabase/             # Clientes Supabase (client e server)
└── lib/
    ├── auth-email.ts                  # Emails via Resend API
    ├── lucia.ts                       # Lógica local da Lucia
    ├── lucia-ai.ts                    # Server function Groq
    └── push.ts                        # Web Push notifications
```

---

## Planos

| Recurso | Free | Gold | Diamond |
|---------|:----:|:----:|:-------:|
| Likes por dia | 20 | ∞ | ∞ |
| Matches ativos | 5 | 20 | ∞ |
| Fotos no chat | ✗ | ✓ | ✓ |
| Desfazer ação | ✗ | ✓ | ✓ |
| Ver quem curtiu | ✗ | 5/dia | ∞ |
| Boost de perfil | ✗ | ✗ | ✓ |
| Filtros avançados | ✗ | ✗ | ✓ |
| **Preço** | Grátis | R$ 29,90/mês | R$ 59,90/mês |

---

## Licença

MIT © [João Vitor Delfino](https://github.com/JoaoVD001)
