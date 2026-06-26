# IA — Lucia

## O que é

Lucia é a assistente virtual integrada ao GymMatch. Ela existe como uma "conversa especial" no app — acessível em `/chat/lucia`, separada dos chats com outros usuários.

## Personalidade

Lucia tem uma personalidade própria: animada, direta, focada em fitness e bem-estar. Ela conhece o contexto do app e pode ajudar o usuário a melhorar o perfil, entender os planos, ou simplesmente conversar sobre treino.

## Como funciona tecnicamente

```
Usuário envia mensagem no chat da Lucia
        ↓
Mensagem + histórico recente enviados para server function
        ↓
Server function chama Groq API (Llama 3.1 8B Instant)
        ↓
Resposta gerada em ~500ms
        ↓
Salva no banco + exibe no chat em tempo real
```

## Memória de conversa

O histórico das conversas com a Lucia é salvo localmente e enviado junto com cada nova mensagem para a Groq API, dando contexto à conversa. A Lucia "lembra" do que foi dito na sessão atual.

## Modelo de IA

- **Provider:** Groq
- **Modelo:** Llama 3.1 8B Instant
- **Por quê:** Inferência extremamente rápida (sub-segundo) e plano gratuito generoso
- **Acesso:** Via API REST com chave em variável de ambiente servidor (`GROQ_API_KEY`)

## Push notifications

Quando o usuário não responde a Lucia por um período, uma Web Push notification é enviada para trazer o usuário de volta. Implementado em `src/lib/push.ts`.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `src/lib/lucia.ts` | Lógica local (histórico, formatação) |
| `src/lib/lucia-ai.ts` | Server function que chama a Groq API |
| `src/routes/_authenticated/chat.lucia.tsx` | Interface do chat |

---

*Ver também: [[Funcionalidades]] · [[Arquitetura Técnica]]*
