# Banco de Dados

## Visão geral

PostgreSQL hospedado no Supabase. Todo o schema está em `supabase/setup_all.sql` e pode ser executado de uma vez no SQL Editor.

Segurança garantida 100% via **Row Level Security (RLS)** — políticas definidas diretamente nas tabelas impedem que um usuário acesse dados de outro, mesmo que a query seja feita diretamente pela API.

---

## Tabelas

### `profiles`
Extensão do `auth.users` do Supabase. Criada automaticamente via trigger quando um novo usuário confirma o email.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | FK para auth.users |
| name | text | Nome do usuário |
| bio | text | Descrição do perfil |
| birth_date | date | Data de nascimento |
| gender | text | Gênero |
| goals | text[] | Objetivos de treino |
| modalities | text[] | Modalidades praticadas |
| photos | text[] | URLs das fotos no Storage |
| profile_complete | boolean | Controla o redirect pós-login |
| is_admin | boolean | Acesso ao painel admin |
| is_suspended | boolean | Conta suspensa pelo admin |

### `gyms`
Academias cadastradas na plataforma.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | text | Nome da academia |
| qr_code | text | Código único do QR |
| address | text | Endereço |
| active | boolean | Academia ativa/inativa |

### `user_gyms`
Relação muitos-para-muitos entre usuários e academias.

### `likes`
Curtidas entre usuários. Quando `user_a` curte `user_b`, um registro é criado. Um trigger verifica se existe o like inverso e cria o match automaticamente.

### `matches`
Matches mútuos. Criados automaticamente pelo trigger no banco — a aplicação nunca cria matches diretamente.

### `messages`
Mensagens do chat. Atualizadas em tempo real via Supabase Realtime.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| match_id | uuid | FK para matches |
| sender_id | uuid | FK para profiles |
| content | text | Texto da mensagem |
| image_url | text | Foto enviada (opcional) |
| read_at | timestamptz | Timestamp de leitura |

### `blocks`
Bloqueios entre usuários. Um usuário bloqueado não aparece no discover e não pode enviar mensagens.

### `reports`
Denúncias. Ficam pendentes no painel admin para moderação.

### `announcements`
Comunicados criados pelo admin para uma academia específica. Aparecem no feed dos usuários daquela academia.

### `subscription_plans` / `subscriptions`
Estrutura de planos (Free, Gold, Diamond) e assinaturas dos usuários. Integração com Stripe planejada.

### `audit_logs`
Log de todas as ações administrativas (suspensão, remoção, etc.) com timestamp e admin responsável.

---

## Trigger de match automático

```sql
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id
      AND liked_id = NEW.liker_id
  ) THEN
    INSERT INTO matches (user1_id, user2_id)
    VALUES (LEAST(NEW.liker_id, NEW.liked_id),
            GREATEST(NEW.liker_id, NEW.liked_id))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

*Ver também: [[Arquitetura Técnica]] · [[Painel Administrativo]]*
