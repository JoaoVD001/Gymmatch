# Planos e Monetização

## Modelo de negócio

Freemium com assinatura mensal. O plano gratuito é funcional o suficiente para o usuário experimentar o produto, mas com limites que criam pressão natural para upgrade.

## Planos

### Free — Grátis
Para quem está começando. Limitado mas funcional.

- 20 likes por dia
- Até 5 matches ativos simultâneos
- Chat de texto
- Acesso à Lucia (IA)

### Gold — R$ 29,90/mês
Para quem usa o app com frequência.

- Likes ilimitados
- Até 20 matches ativos
- Chat de texto + **envio de fotos**
- Desfazer última ação (undo)
- Ver até 5 perfis que te curtiram

### Diamond — R$ 59,90/mês
Para quem quer o máximo.

- Tudo do Gold
- Matches ilimitados
- Ver **todos** os perfis que te curtiram
- Boost de perfil (aparece primeiro no feed)
- Filtros avançados (idade, objetivos, modalidade)

## Tabela comparativa

| Recurso | Free | Gold | Diamond |
|---------|:----:|:----:|:-------:|
| Likes por dia | 20 | ∞ | ∞ |
| Matches ativos | 5 | 20 | ∞ |
| Fotos no chat | ✗ | ✓ | ✓ |
| Desfazer ação | ✗ | ✓ | ✓ |
| Ver quem curtiu | ✗ | até 5 | ∞ |
| Boost de perfil | ✗ | ✗ | ✓ |
| Filtros avançados | ✗ | ✗ | ✓ |
| **Preço** | **Grátis** | **R$ 29,90/mês** | **R$ 59,90/mês** |

## Integração de pagamento — Stripe

O pagamento é processado via **Stripe Checkout** (página hospedada pelo Stripe).

### Fluxo completo
1. Usuário clica em "Assinar" na tela `/premium`
2. Frontend chama a server function `createCheckoutSession`
3. Server function chama a API REST do Stripe e retorna a `session.url`
4. Usuário é redirecionado para o checkout do Stripe (cartão + Pix)
5. Após pagamento → Stripe redireciona para `/payment/success?session_id=...&plan=gold`
6. Server function `activatePlanFromSession` verifica o pagamento e atualiza `profiles.plan` no Supabase
7. Tela de sucesso exibe confirmação e redireciona para `/discover`

### Arquivos relevantes
- `src/lib/stripe.ts` — server functions `createCheckoutSession` e `activatePlanFromSession`
- `src/routes/_authenticated/_app/payment.tsx` — tela de checkout
- `src/routes/_authenticated/_app/payment_.success.tsx` — tela de sucesso pós-pagamento

### Variáveis de ambiente necessárias
```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_GOLD=price_1TmPv3DKLvTK7rzsk7kYOHpO
STRIPE_PRICE_DIAMOND=price_1TmPxnDKLvTK7rzsDnoiUqPR
```

### Produtos no Stripe
| Produto | Price ID | Valor |
|---------|----------|-------|
| GymMatch Gold | `price_1TmPv3DKLvTK7rzsk7kYOHpO` | R$ 29,90/mês |
| GymMatch Diamond | `price_1TmPxnDKLvTK7rzsDnoiUqPR` | R$ 59,90/mês |

> Os price IDs acima são da **área restrita** (sandbox/teste). Para produção, criar novos produtos no dashboard de produção do Stripe.

## Status da implementação

- ✅ Estrutura de planos no banco (`profiles.plan`)
- ✅ Enforcement server-side via RPC `handle_swipe` (likes e matches)
- ✅ Enforcement frontend: imagens no chat, desfazer curtida, ver quem curtiu
- ✅ Tela de planos redesenhada (`/premium`)
- ✅ Stripe Checkout integrado (cartão + Pix)
- ✅ Ativação automática do plano após pagamento
- ✅ Tela de sucesso pós-pagamento
- ⏳ Webhook Stripe para cancelamentos (`customer.subscription.deleted`)
- ⏳ Price IDs de produção (ao fazer deploy)

---

*Ver também: [[Funcionalidades]] · [[Status e Roadmap]] · [[Arquitetura Técnica]]*
