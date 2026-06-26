# Funcionalidades

## Autenticação

- Cadastro com email e senha
- Confirmação de email via link (enviado pelo [[Emails e Comunicação|Resend]])
- Login com email e senha
- Esqueci a senha — link de recuperação por email
- Redirecionamento automático pós-login: admin → `/admin`, perfil incompleto → `/onboarding`, usuário normal → `/discover`

## Onboarding

- Preenchimento do perfil na primeira entrada (nome, idade, bio, objetivos, modalidades)
- Upload de fotos
- Seleção da academia via QR code ou busca

## Entrada por QR code

- Cada academia tem uma URL única no formato `/join/:qrCode`
- Ao acessar, o usuário é associado àquela academia automaticamente
- Permite que múltiplas academias coexistam na plataforma de forma isolada

## Discover (Swipe)

- Feed de perfis de pessoas da mesma academia
- Interface de swipe com suporte a gestos touch (mobile-first)
- Curtir ou passar sem que a outra pessoa saiba
- Limite de likes diários no plano Free (20/dia)

## Sistema de Match

- Quando dois usuários se curtem mutuamente, um match é criado **automaticamente via trigger no PostgreSQL**
- Notificação de novo match em tempo real
- Match abre o chat entre os dois usuários

## Chat

- Mensagens em tempo real via **Supabase Realtime**
- Indicador de leitura
- Envio de fotos (planos Gold e Diamond)
- Bloqueio de usuário diretamente pelo chat
- Denúncia com motivo

## Segurança

- Bloqueio silencioso (o usuário bloqueado não sabe)
- Sistema de denúncias com categorias
- Moderação via [[Painel Administrativo]]
- RLS (Row Level Security) no banco — cada usuário acessa só os próprios dados

## Notificações

- Web Push notifications para novas mensagens e matches
- Push por inatividade no chat da [[IA — Lucia|Lucia]]

---

*Ver também: [[Planos e Monetização]] · [[IA — Lucia]] · [[Fluxo do Usuário]]*
