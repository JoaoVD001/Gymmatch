# Painel Administrativo

## Acesso

Usuários com `is_admin = true` no perfil são redirecionados para `/admin` após o login. O painel é completamente separado da experiência do usuário normal.

## Funcionalidades

### Gestão de usuários (`/admin/users`)
- Listagem de todos os usuários cadastrados
- Busca por nome ou email
- Ver detalhes do perfil
- Suspender conta (`is_suspended = true`)
- Remover usuário permanentemente
- Promover a admin

### Gestão de academias (`/admin/gyms`)
- Cadastrar novas academias
- Gerar QR code para cada academia
- Ativar / desativar academia
- Ver quantos usuários estão vinculados

### Denúncias (`/admin/reports`)
- Fila de denúncias pendentes
- Ver perfil do denunciado e do denunciante
- Motivo da denúncia
- Ações: suspender usuário, ignorar denúncia, remover conteúdo

### Comunicados (`/admin/announcements`)
- Criar comunicado para uma academia específica (ou todas)
- O comunicado aparece no feed dos usuários daquela academia
- Controle de data de expiração

## Segurança

- Rota protegida por `is_admin` verificado via `useAuth()`
- RLS no banco garante que um usuário comum não consegue ler dados de outros usuários mesmo que tente acessar a API diretamente
- Todas as ações admin são registradas em `audit_logs` com timestamp

---

*Ver também: [[Banco de Dados]] · [[Funcionalidades]]*
