# Status e Roadmap

## Concluído

### Infraestrutura
- [x] Migração para novo projeto Supabase
- [x] Schema completo do banco com RLS em todas as tabelas
- [x] Deploy configurado para Cloudflare Workers (Wrangler)
- [x] Variáveis de ambiente documentadas (`.env.example`)
- [x] Repositório público no GitHub com README profissional

### Autenticação
- [x] Cadastro e login com email e senha
- [x] Recuperação de senha por email
- [x] Email nativo do Supabase Auth (sem dependência externa de Resend/Brevo)
- [x] Redirect pós-confirmação → onboarding
- [x] Todos os erros traduzidos para português via `translateError()`

### App
- [x] Landing page
- [x] Onboarding completo
- [x] Entrada via QR code por academia
- [x] Discover com swipe de perfis + undo (Gold/Diamond)
- [x] Sistema de match via trigger no PostgreSQL
- [x] Chat em tempo real (Supabase Realtime)
- [x] Envio de imagens no chat (Gold/Diamond)
- [x] IA Lucia integrada (Groq API)
- [x] Push notifications
- [x] Bloqueio e denúncia de usuários
- [x] Painel administrativo completo
- [x] Perfil com loading state e fallback de erro

### Monetização
- [x] Tela de planos redesenhada (`/premium`)
- [x] Stripe Checkout integrado via fetch direto na REST API (sem SDK)
- [x] Ativação automática do plano após pagamento
- [x] Enforcement de limites: likes, matches, imagens, desfazer
- [x] Popup de upgrade (`UpgradeModal`) — ao atingir qualquer limite aparece modal com os dois planos, X para fechar, botão vai direto para o checkout
- [x] "Quem curtiu você" bloqueado/limitado por plano
- [x] Tela de sucesso pós-pagamento

### Discover
- [x] Navegação de fotos no card: toque na metade esquerda/direita da imagem troca de foto; barra de progresso no topo indica quantas fotos há e em qual está
- [x] Exercícios por dia da semana: botão "Meus Exercícios" abre modal com grid dos 7 dias; ao selecionar um dia, lista e adiciona exercícios (nome, séries, reps); resumo aparece na tela principal

### Design
- [x] Dark theme com design system próprio (oklch)
- [x] Mobile-first
- [x] Toasts customizados com borda colorida por tipo
- [x] Favicon SVG com ícone Dumbbell
- [x] Título da aba: "GymMatch"
- [x] Bottom nav: efeito spotlight — barra faz "pop" rápido (0.3s scaleX) na nova posição, cone acende devagar (0.7s scaleY) como luz real
- [x] Discover: pilha de cards, tint verde/vermelho ao arrastar, badges CURTIR/NOPE com glow
- [x] Perfil (`/me`): layout estilo Instagram — botões em linha, engrenagem abre sheet de configurações
- [x] Fotos: grid 6 slots fixos (1 grande + 2 empilhados + 3 linha inferior); limite de 6 fotos; galeria usa só `user_photos` (não mistura com `photo_url`)
- [x] Perfil (`/me`): redesign final — fundo radial oklch hue 280 (mesma cor da taskbar), card glassmorphism, botão "Editar perfil" coral `bg-primary`, source picker e settings sheet no mesmo tom escuro

### Treino
- [x] Aba Treino na bottom nav (ícone Dumbbell, rota `/treino`)
- [x] Plano semanal: usuário define o treino de cada dia da semana (seg–dom), salvo em `workout_schedule` com upsert; dia atual destacado
- [x] Convites de treino: botão "Convidar" seleciona match, data/hora e academia e envia convite salvo em `workout_invites`
- [x] Convites recebidos aparecem no topo da tela com botões Aceitar/Recusar
- [x] Lista colapsável de treinos marcados com status (pendente/confirmado/recusado)
- [x] Modal de convite redesenhado — fundo escuro oklch, cards com foto do match, grid data+hora lado a lado

### Push Notifications (Web Push real)
- [x] Service Worker (`/sw.js`) registrado e lida com eventos `push` e `notificationclick`
- [x] VAPID keys geradas e configuradas no `.env`
- [x] `push_subscriptions` table — guarda assinatura push por usuário (endpoint + p256dh + auth)
- [x] `subscribePush()` em `src/lib/push.ts` — pede permissão e salva assinatura no banco
- [x] Edge Function `send-push` — recebe `{user_id, title, body, url}` e envia push via `web-push`
- [x] Edge Function `workout-reminders` — verifica invites aceitos e envia lembretes 1 dia e 2h antes
- [x] pg_cron agendado a cada 15min para chamar `workout-reminders`
- [x] Ao enviar convite: destinatário recebe push imediato
- [x] Ao aceitar convite: remetente recebe push de confirmação

---

## Bugs corrigidos

| # | Bug | Causa | Fix |
|---|-----|-------|-----|
| 1 | Discover não mostrava nenhum usuário | RLS de `user_gyms` bloqueava leitura cruzada dentro da policy de `profiles` | Criada função `check_same_gym()` com `SECURITY DEFINER` |
| 2 | `handle_swipe` retornava erro "column reference is ambiguous" | Parâmetros `from_user`/`to_user` colidiam com colunas da tabela `likes` no INSERT | Qualificação explícita com `handle_swipe.from_user` e `handle_swipe.to_user` |
| 3 | Perfil não carregava (tela em branco) | Query async rodava antes do `useState` inicializar; `if (!p)` disparava cedo | Adicionado estado `loading` com `Promise.all().finally()` |
| 4 | "Error sending confirmation email" no cadastro | Supabase Free tem rate limit de email e o Resend não estava configurado corretamente | Migração para email nativo do Supabase Auth (`auth.signUp()`) |
| 5 | Stripe SDK causava erro de runtime | O pacote `stripe` npm é incompatível com Cloudflare Workers / TanStack Start | Reescrito para usar `fetch` direto na REST API do Stripe |
| 6 | Usuário não conseguia reutilizar email após excluir conta | `setStatus("deleted")` apenas marcava o perfil, mantendo o Auth user | Documentado para fix futuro (ver Pendente → Produto) |

---

## Pendente

### Monetização
- [ ] Webhook Stripe para cancelamentos (`customer.subscription.deleted` → reverter plano para free)
- [ ] **Ativar Stripe para produção** — ver checklist abaixo antes do lançamento

### Produto
- [ ] **Reuso de email após exclusão de conta** — ao excluir o perfil, deletar também o Auth user via `supabaseAdmin.auth.admin.deleteUser(userId)`, exceto se houver registro em `blocks`/`reports`
- [ ] Filtros avançados no discover (por objetivo, modalidade, horário) — exclusivo Diamond
- [ ] Sistema de boost de perfil — aparecer primeiro no feed
- [ ] Stories ou status de treino
- [ ] Verificação de academia (usuário realmente frequenta)
- [ ] Reordenar fotos por drag-and-drop na tela de edição
- [ ] Cancelar convite de treino já enviado
- [ ] Histórico de treinos passados separado dos futuros

### Deploy
- [ ] Deploy em produção no Cloudflare Workers
- [ ] Domínio próprio
- [ ] Configurar templates de email no Supabase Dashboard (confirmação + reset de senha)
- [ ] Ativar "Confirm email" no Supabase Auth (atualmente OFF para testes)

### Melhorias técnicas
- [ ] Tipos TypeScript do Supabase desatualizados — `user_photos` não está no schema gerado, causando erros de tipo em `me.tsx` e `profile.edit.tsx`
- [ ] Regenerar tipos com `supabase gen types typescript` após atualizar o schema

---

## Checklist de lançamento — Stripe Produção

> ⚠️ Atualmente o Stripe está em **modo sandbox** (área restrita). Nenhum pagamento real é processado. Antes de lançar:

- [ ] Acessar o dashboard de produção do Stripe (sem o badge "Área Restrita")
- [ ] Completar a verificação de identidade e adicionar dados bancários para receber repasses
- [ ] Criar os produtos **GymMatch Gold** (R$ 29,90/mês) e **GymMatch Diamond** (R$ 59,90/mês) no catálogo de **produção**
- [ ] Copiar os novos `price_...` de produção e atualizar `.env`
- [ ] Substituir no `.env` de produção:
  - `STRIPE_SECRET_KEY` → trocar `sk_test_...` por `sk_live_...`
  - `VITE_STRIPE_PUBLISHABLE_KEY` → trocar `pk_test_...` por `pk_live_...`
  - `STRIPE_PRICE_GOLD` → novo price ID de produção
  - `STRIPE_PRICE_DIAMOND` → novo price ID de produção
- [ ] Configurar webhook de produção no Stripe Dashboard → Developers → Webhooks
- [ ] Adicionar `STRIPE_WEBHOOK_SECRET` ao `.env` de produção
- [ ] Testar um pagamento real de R$ 1,00 para confirmar que o repasse funciona

---

## Futuro

- [ ] App mobile nativo (React Native ou Flutter)
- [ ] Integração com wearables (frequência de treino real)
- [ ] Grupos por academia (além do 1-a-1)
- [ ] Eventos presenciais organizados pela academia

---

*Ver também: [[Planos e Monetização]] · [[Arquitetura Técnica]]*
