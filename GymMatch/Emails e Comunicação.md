# Emails e Comunicação

## Por que não usar o email do Supabase

O Supabase Free não permite configurar SMTP customizado — ele usa um servidor próprio com baixa entregabilidade e sem controle de template. Emails frequentemente caem no spam.

## Solução implementada

Bypass completo do sistema de email do Supabase usando duas etapas:

1. **Geração do link** — `supabase.auth.admin.generateLink()` gera o link de confirmação/recovery sem enviar email
2. **Envio via Resend** — o link é embutido no template HTML e enviado pela API do Resend

Todo o código está em `src/lib/auth-email.ts` como server functions (`createServerFn`), garantindo que a chave do Resend nunca é exposta no cliente.

## Templates de email

Estilo light e minimalista — inspirado nos emails do Ballpark. Fundo cinza claro (`#f0f0f5`), card branco, header com gradiente coral.

### Email de confirmação de conta
- **Assunto:** Confirme seu email — GymMatch
- **Conteúdo:** Boas-vindas + botão "Confirmar email" + aviso de expiração (24h)

### Email de recuperação de senha
- **Assunto:** Redefinir sua senha — GymMatch
- **Conteúdo:** Instrução + botão "Redefinir senha" + aviso de expiração (1h) + nota de segurança

## Estrutura do template HTML

```
┌─────────────────────────────────┐
│  [G] GymMatch    ← header coral │
├─────────────────────────────────┤
│                                 │
│  Título                         │
│  Descrição                      │
│                                 │
│  [ Botão de ação ]              │
│                                 │
│  Nota de rodapé                 │
├─────────────────────────────────┤
│  © 2025 GymMatch                │
└─────────────────────────────────┘
```

## Remetente

`GymMatch <onboarding@resend.dev>` — usando o domínio padrão do Resend enquanto um domínio próprio não é configurado.

## Erros em português

Todos os erros da API do Supabase (em inglês) são traduzidos pela função `translateError()` em `src/lib/utils.ts` antes de serem exibidos ao usuário.

Exemplos:
- `"invalid login credentials"` → `"Email ou senha incorretos."`
- `"a user with this email address has already been registered"` → `"Este email já está cadastrado. Tente fazer login."`
- `"token has expired or is invalid"` → `"O link expirou ou é inválido. Solicite um novo."`

---

*Ver também: [[Fluxo do Usuário]] · [[Arquitetura Técnica]]*
