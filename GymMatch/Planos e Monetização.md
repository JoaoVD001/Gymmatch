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
- Desfazer última ação (undos)
- Ver até 5 perfis que te curtiram por dia

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
| Ver quem curtiu | ✗ | 5/dia | ∞ |
| Boost de perfil | ✗ | ✗ | ✓ |
| Filtros avançados | ✗ | ✗ | ✓ |
| **Preço** | **Grátis** | **R$ 29,90/mês** | **R$ 59,90/mês** |

## Status da implementação

- ✅ Estrutura de planos no banco (`subscription_plans`)
- ✅ Tabela de assinaturas por usuário (`subscriptions`)
- ✅ Tela de planos no app (`/premium`)
- ⏳ Integração com Stripe (pendente)
- ⏳ Webhooks de pagamento (pendente)
- ⏳ Enforcement de limites por plano (parcialmente implementado)

---

*Ver também: [[Funcionalidades]] · [[Status e Roadmap]]*
