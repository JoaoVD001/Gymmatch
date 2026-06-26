# Fluxo do Usuário

## 1. Entrada no app

```
Usuário escaneia QR code da academia
        ↓
Acessa /join/:qrCode
        ↓
Não tem conta? → /auth (modo signup)
Tem conta?     → /auth (modo signin)
```

## 2. Cadastro

```
Preenche email + senha
        ↓
Server function gera link de confirmação (Supabase Admin)
        ↓
Email enviado via Resend com botão "Confirmar email"
        ↓
Usuário clica no link → redirecionado para /auth
        ↓
Supabase troca o ?code= por uma sessão válida
        ↓
Redirect automático → /onboarding
```

## 3. Onboarding

```
Preenche nome, bio, data de nascimento, gênero
        ↓
Seleciona objetivos e modalidades
        ↓
Faz upload de fotos
        ↓
profile_complete = true
        ↓
Redirect → /discover
```

## 4. Discover (uso diário)

```
Feed carrega perfis da mesma academia
        ↓
Usuário dá swipe right (curtir) ou swipe left (passar)
        ↓
Curtiu → like salvo no banco
        ↓
Trigger verifica se existe like inverso
        ↓
Sim → match criado automaticamente → notificação
Não → aguarda
```

## 5. Chat

```
Match criado → chat disponível em /matches
        ↓
Usuário abre o chat com um match
        ↓
Mensagens em tempo real via Supabase Realtime
        ↓
Gold/Diamond → pode enviar fotos
        ↓
Opções: bloquear ou denunciar
```

## 6. Recuperação de senha

```
/auth → "Esqueceu sua senha?"
        ↓
Digita email → server function gera link de recovery
        ↓
Email enviado via Resend
        ↓
Usuário clica no link → redirecionado para /auth
        ↓
onAuthStateChange detecta PASSWORD_RECOVERY
        ↓
Modo "reset" ativado → usuário define nova senha
```

---

*Ver também: [[Funcionalidades]] · [[Emails e Comunicação]]*
