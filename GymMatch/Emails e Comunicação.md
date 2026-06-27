# Emails e Comunicação

## Solução atual

O GymMatch usa o **sistema de email nativo do Supabase Auth**. Não há dependência de Resend, Brevo ou qualquer serviço externo de email.

### Por que Supabase nativo?
- Zero configuração extra
- Funciona out-of-the-box no plano gratuito
- Menos variáveis de ambiente, menos pontos de falha
- O Supabase já lida com os links de confirmação e recovery

### Fluxo de cadastro
```ts
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: { emailRedirectTo: `${window.location.origin}/auth` },
});
```

### Fluxo de recuperação de senha
```ts
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth`,
});
```

## Templates de email — configurar no Supabase

Os templates precisam ser configurados em **Authentication → Email Templates** no dashboard do Supabase.

### Confirmar cadastro
```html
<h2>Confirme seu email</h2>
<p>Clique no botão abaixo para ativar sua conta no GymMatch:</p>
<a href="{{ .ConfirmationURL }}">Confirmar email</a>
```

### Redefinir senha
```html
<h2>Redefinir senha</h2>
<p>Clique no botão abaixo para criar uma nova senha:</p>
<a href="{{ .ConfirmationURL }}">Redefinir senha</a>
```

> ⚠️ **Pendente:** Os templates ainda não foram customizados no dashboard. Atualmente o Supabase usa o template padrão em inglês.

## Estado atual para testes

- **"Confirm email"** está **desativado** no Supabase Auth (Authentication → Settings → toggle OFF)
- Isso permite criar contas sem precisar confirmar o email — útil durante o desenvolvimento
- **Antes do lançamento:** reativar a confirmação de email e configurar os templates acima

## Erros em português

Todos os erros da API do Supabase (em inglês) são traduzidos pela função `translateError()` em `src/lib/utils.ts` antes de serem exibidos ao usuário.

Exemplos:
- `"invalid login credentials"` → `"Email ou senha incorretos."`
- `"a user with this email address has already been registered"` → `"Este email já está cadastrado. Tente fazer login."`
- `"token has expired or is invalid"` → `"O link expirou ou é inválido. Solicite um novo."`
- `"rate limit exceeded"` → `"Muitas tentativas. Aguarde um momento e tente novamente."`

---

*Ver também: [[Fluxo do Usuário]] · [[Arquitetura Técnica]]*
