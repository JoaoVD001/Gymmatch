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
- [x] Todos os erros traduzidos para português

### App
- [x] Landing page
- [x] Onboarding completo
- [x] Entrada via QR code por academia
- [x] Discover com swipe de perfis
- [x] Sistema de match via trigger no PostgreSQL
- [x] Chat em tempo real (Supabase Realtime)
- [x] IA Lucia integrada (Groq API)
- [x] Push notifications
- [x] Bloqueio e denúncia de usuários
- [x] Painel administrativo completo

### Design
- [x] Dark theme com design system próprio (oklch)
- [x] Mobile-first
- [x] Toasts customizados com borda colorida por tipo
- [x] Favicon SVG com ícone Dumbbell
- [x] Título da aba: "GymMatch"

---

## Pendente

### Monetização
- [ ] Integração Stripe para pagamentos
- [ ] Webhooks de confirmação de pagamento
- [ ] Enforcement de limites por plano no backend
- [ ] Página de sucesso / cancelamento de assinatura

### Deploy
- [ ] Deploy em produção no Cloudflare Workers
- [ ] Domínio próprio
- [ ] Domínio de email para Resend (sair do `@resend.dev`)

### Produto
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
