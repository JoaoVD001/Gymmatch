# Status e Roadmap

## Concluído

### Infraestrutura
- [x] Migração para novo projeto Supabase
- [x] Schema completo do banco com RLS em todas as tabelas
- [x] Deploy configurado para Cloudflare Workers (Wrangler)
- [x] Variáveis de ambiente documentadas (`.env.example`)
- [x] Repositório público no GitHub com README profissional

### Autenticação
- [x] Cadastro com confirmação de email
- [x] Login com email e senha
- [x] Recuperação de senha por email
- [x] Bypass do email do Supabase via Resend API
- [x] Templates de email customizados (light theme, branded)
- [x] Redirect pós-confirmação → onboarding (corrigido)
- [x] Todos os erros traduzidos para português

### App
- [x] Landing page
- [x] Onboarding completo (single-select corrigido)
- [x] Entrada via QR code por academia
- [x] Discover com swipe de perfis + undo (Gold/Diamond)
- [x] Sistema de match via trigger no PostgreSQL
- [x] Chat em tempo real (Supabase Realtime)
- [x] Envio de imagens no chat (Gold/Diamond)
- [x] IA Lucia integrada (Groq API)
- [x] Push notifications
- [x] Bloqueio e denúncia de usuários
- [x] Painel administrativo completo
- [x] Página de perfil com fallback de erro

### Monetização
- [x] Tela de planos redesenhada (`/premium`)
- [x] Stripe Checkout integrado (cartão + Pix)
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
- [x] Bottom nav redesenhada — pill flutuante com glass blur e label animado no item ativo
- [x] Discover: animação de swipe redesenhada — pilha de cards, tint verde/vermelho, badges CURTIR/NOPE com glow
- [x] Perfil (`/me`): layout estilo Instagram — botões "Editar perfil" e "Premium" em linha, engrenagem abre sheet de configurações minimalista
- [x] Fotos: grade unificada estilo Tinder na tela de perfil (foto principal 2×2 + extras), upload direto sem bottom sheet

---

## Pendente

### Monetização
- [ ] Webhook Stripe para cancelamentos (`customer.subscription.deleted` → reverter para free)
- [ ] **Ativar Stripe para produção** — ver checklist abaixo antes do lançamento

### Deploy
- [ ] Deploy em produção no Cloudflare Workers
- [ ] Domínio próprio
- [ ] Domínio de email para Resend (sair do `@resend.dev`)

---

## Checklist de lançamento — Stripe Produção

> ⚠️ Atualmente o Stripe está em **modo sandbox** (área restrita). Nenhum pagamento real é processado. Antes de lançar:

- [ ] Acessar o [dashboard de produção do Stripe](https://dashboard.stripe.com) (sem o badge "Área Restrita")
- [ ] Completar a verificação de identidade e adicionar dados bancários para receber repasses
- [ ] Criar os produtos **GymMatch Gold** (R$ 29,90/mês) e **GymMatch Diamond** (R$ 59,90/mês) no catálogo de **produção**
- [ ] Copiar os novos `price_...` de produção
- [ ] Substituir no `.env` de produção:
  - `STRIPE_SECRET_KEY` → trocar `sk_test_...` por `sk_live_...`
  - `VITE_STRIPE_PUBLISHABLE_KEY` → trocar `pk_test_...` por `pk_live_...`
  - `STRIPE_PRICE_GOLD` → novo price ID de produção
  - `STRIPE_PRICE_DIAMOND` → novo price ID de produção
- [ ] Configurar webhook de produção no Stripe Dashboard → Developers → Webhooks
- [ ] Adicionar `STRIPE_WEBHOOK_SECRET` ao `.env` de produção
- [ ] Testar um pagamento real de R$ 1,00 para confirmar que o repasse funciona

### Produto
- [ ] **Reuso de email após exclusão de conta** — atualmente ao excluir a conta o usuário do Auth permanece, impedindo novo cadastro com o mesmo email. Solução: ao excluir perfil, deletar também o usuário do Auth via `supabaseAdmin.auth.admin.deleteUser(userId)`, exceto se estiver banido (checar tabela `blocks`/`reports` antes)
- [ ] Filtros avançados no discover (por plano Diamond)
- [ ] Sistema de boost de perfil
- [ ] Notificações de match em tempo real (push)
- [ ] Stories ou status de treino
- [ ] Verificação de academia (usuário realmente frequenta)

### Futuro
- [ ] App mobile nativo (React Native ou Flutter)
- [ ] Integração com wearables (frequência de treino real)
- [ ] Grupos por academia (além do 1-a-1)
- [ ] Eventos presenciais organizados pela academia

---

*Ver também: [[Planos e Monetização]] · [[Arquitetura Técnica]]*
