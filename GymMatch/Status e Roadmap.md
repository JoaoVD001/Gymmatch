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
- [x] "Quem curtiu você" bloqueado/limitado por plano
- [x] Tela de sucesso pós-pagamento

### Design
- [x] Dark theme com design system próprio (oklch)
- [x] Mobile-first
- [x] Toasts customizados com borda colorida por tipo
- [x] Favicon SVG com ícone Dumbbell
- [x] Título da aba: "GymMatch"
- [x] Bottom nav: pill flutuante com glass blur e label animado no item ativo
- [x] Discover: pilha de cards, tint verde/vermelho ao arrastar, badges CURTIR/NOPE com glow
- [x] Perfil (`/me`): layout estilo Instagram — botões em linha, engrenagem abre sheet de configurações
- [x] Fotos: grade unificada estilo Tinder (foto principal 2×2 + extras), upload direto sem bottom sheet

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
- [ ] Notificações push de match em tempo real
- [ ] Stories ou status de treino
- [ ] Verificação de academia (usuário realmente frequenta)
- [ ] Reordenar fotos por drag-and-drop na tela de edição

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
