# Referência de endpoints

Base URL: `http://localhost:8080/api/v1`

---

## GET /health

Verifica se a API está em execução.

**Autenticação:** não requerida

### Health — resposta 200

```json
{
  "data": {
    "status": "UP",
    "service": "backend",
    "timestamp": "2026-09-09T14:00:00Z"
  },
  "message": "API operacional e conectada.",
  "timestamp": "2026-09-09T14:00:00Z"
}
```

### Health — exemplo curl

```bash
curl http://localhost:8080/api/v1/health
```

---

## POST /auth/login

Autentica um paciente ou nutricionista e retorna um token JWT.

**Autenticação:** não requerida

### Login — corpo da requisição

```json
{
  "email": "nutri@nutri4you.com",
  "senha": "sua-senha"
}
```

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `email` | string | Sim | E-mail cadastrado no sistema |
| `senha` | string | Sim | Senha em texto plano (validada contra hash BCrypt) |

### Login — resposta 200

```json
{
  "data": {
    "token": "<token-jwt-exemplo>",
    "tipoUsuario": "NUTRICIONISTA"
  },
  "message": "Login realizado com sucesso.",
  "timestamp": "2026-09-09T14:00:00Z"
}
```

| Campo (`data`) | Tipo | Descrição |
| --- | --- | --- |
| `token` | string | JWT assinado com HMAC256 |
| `tipoUsuario` | string | `PACIENTE` ou `NUTRICIONISTA` |

### Login — resposta 401

```json
{
  "status": 401,
  "error": "NAO_AUTORIZADO",
  "message": "E-mail ou senha incorretos.",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-09-09T14:00:00Z"
}
```

### Login — exemplo curl

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nutri@nutri4you.com","senha":"sua-senha"}'
```

---

## POST /pacientes/autocadastro

Cadastra um novo paciente no sistema.

**Autenticação:** não requerida

### Autocadastro — corpo da requisição

```json
{
  "nome": "Maria Silva",
  "cpf": "123.456.789-00",
  "dataNascimento": "1995-03-15",
  "sexo": "Feminino",
  "telefone": "41999998888",
  "email": "maria@email.com",
  "senha": "senhaSegura123"
}
```

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `nome` | string | Sim | Nome completo |
| `cpf` | string | Não | CPF (único na tabela) |
| `dataNascimento` | string (ISO date) | Não | Formato `YYYY-MM-DD` |
| `sexo` | string | Não | Ex.: `Masculino`, `Feminino` |
| `telefone` | string | Não | Telefone de contato |
| `email` | string | Sim | Normalizado para minúsculas; único no sistema |
| `senha` | string | Sim | Criptografada com BCrypt antes de persistir |

### Regras de negócio

- `nome`, `email` e `senha` são obrigatórios.
- E-mail é normalizado (`trim` + `toLowerCase`).
- E-mail duplicado (Paciente ou Nutricionista) retorna `400`.
- Senha nunca é armazenada em texto plano.
- Paciente nasce com `email_confirmado=false` (confirmação em S2-B3).

### Autocadastro — resposta 201

```json
{
  "data": {
    "mensagem": "Paciente cadastrado com sucesso!"
  },
  "message": "Paciente cadastrado com sucesso!",
  "timestamp": "2026-09-09T14:00:00Z"
}
```

### Autocadastro — resposta 400

```json
{
  "status": 400,
  "error": "REQUISICAO_INVALIDA",
  "message": "Nome, e-mail e senha são obrigatórios.",
  "path": "/api/v1/pacientes/autocadastro",
  "timestamp": "2026-09-09T14:00:00Z"
}
```

### Autocadastro — exemplo curl

```bash
curl -X POST http://localhost:8080/api/v1/pacientes/autocadastro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "senha": "senhaSegura123"
  }'
```

---

## POST /nutricionistas/cadastro

Cadastra um nutricionista. **Não é rota pública** — exige JWT de nutricionista logado.

**Autenticação:** `ROLE_NUTRICIONISTA`

### Cadastro nutri — corpo

```json
{
  "nome": "Novo Nutricionista",
  "email": "novo@nutri.com",
  "senha": "senhaSegura123",
  "crn": "CRN8-54321"
}
```

### Cadastro nutri — resposta 201

Envelope padrão com `data.mensagem`.

### Cadastro nutri — resposta 403

Sem token ou token de paciente.

---

## GET /usuarios/me

Retorna dados do usuário autenticado.

**Autenticação:** JWT válido (paciente ou nutricionista)

### /me — resposta 200

```json
{
  "data": {
    "id": 1,
    "nome": "Gabriel de Paula Brasil",
    "email": "nutri@nutri4you.com",
    "perfil": "NUTRICIONISTA"
  },
  "message": "Usuário autenticado.",
  "timestamp": "2026-09-15T12:00:00Z"
}
```

| Campo | Valores |
| --- | --- |
| `data.perfil` | `PACIENTE` ou `NUTRICIONISTA` |

---

## DELETE /usuarios/me/nutricionistas/{idNutricionista}/relacao

Paciente encerra relação clínica recorrente com um nutricionista (Q17).

**Autenticação:** JWT de paciente

### Resposta 200

```json
{
  "data": { "mensagem": "Relação recorrente encerrada com sucesso." },
  "message": "Relação recorrente encerrada com sucesso."
}
```

### Erros

| Código | Motivo |
| --- | --- |
| `403` | Token de nutricionista ou ausente |
| `400` | Relação ativa inexistente |

---

## GET /gestao-pacientes

Lista pacientes visíveis ao nutricionista logado (filtro Q16: relação clínica **ATIVA** ou consulta registrada).

**Autenticação:** `ROLE_NUTRICIONISTA`

### Listagem — resposta 200

```json
{
  "data": [
    {
      "id": 1,
      "nome": "Arthur Henrique Deretti",
      "cpf": "111.222.333-44",
      "email": "arthur@email.com",
      "telefone": "41999999999",
      "sexo": "Masculino",
      "dataNascimento": "2000-01-01"
    }
  ],
  "message": "Pacientes listados com sucesso.",
  "timestamp": "2026-09-15T12:00:00Z"
}
```

### Listagem — resposta 403

Token ausente ou usuário sem role nutricionista.

---

## GET /gestao-pacientes/busca

Busca global de paciente cadastrado por e-mail **ou** CPF (exatamente um parâmetro).

**Autenticação:** `ROLE_NUTRICIONISTA`

### Query params

| Param | Obrigatório | Descrição |
| --- | --- | --- |
| `email` | Um de `email` ou `cpf` | E-mail do paciente (case-insensitive) |
| `cpf` | Um de `email` ou `cpf` | CPF com ou sem máscara |

### Resposta 200

```json
{
  "data": {
    "id": 2,
    "nome": "Arthur Henrique Deretti",
    "email": "arthur@email.com",
    "cpf": "111.222.333-44"
  },
  "message": "Paciente encontrado com sucesso."
}
```

### Erros

| Código | Motivo |
| --- | --- |
| `400` | Nenhum ou ambos os parâmetros informados |
| `404` | Paciente não encontrado |

---

## GET /gestao-pacientes/{id}

Busca paciente por ID. Exige relação clínica ativa ou consulta com o nutricionista logado.

**Autenticação:** `ROLE_NUTRICIONISTA`

### Erros

| Código | Motivo |
| --- | --- |
| `403` | Paciente existe, mas nutricionista sem acesso |
| `404` | ID inexistente |

---

## PUT /gestao-pacientes/{id}

Atualiza nome, telefone, sexo e data de nascimento.

**Autenticação:** `ROLE_NUTRICIONISTA`

### Atualização — corpo

```json
{
  "nome": "Nome Atualizado",
  "telefone": "41988887777",
  "sexo": "Masculino",
  "dataNascimento": "1990-05-20"
}
```

---

## POST /gestao-pacientes/{id}/vincular

Cria ou reativa relação clínica recorrente entre nutricionista logado e paciente (Q17).

**Autenticação:** `ROLE_NUTRICIONISTA`

### Resposta 200

```json
{
  "data": { "mensagem": "Paciente vinculado com sucesso." },
  "message": "Paciente vinculado com sucesso."
}
```

### Erros

| Código | Motivo |
| --- | --- |
| `404` | Paciente inexistente |

---

## DELETE /gestao-pacientes/{id}/relacao

Nutricionista encerra relação clínica recorrente com o paciente (Q17).

**Autenticação:** `ROLE_NUTRICIONISTA`

### Resposta 200

```json
{
  "data": { "mensagem": "Relação recorrente encerrada com sucesso." },
  "message": "Relação recorrente encerrada com sucesso."
}
```

### Erros

| Código | Motivo |
| --- | --- |
| `400` | Relação ativa inexistente |

---

## Rotas removidas (S2-B1)

| Rota | Motivo |
| --- | --- |
| `DELETE /gestao-pacientes/{id}` | Soft delete removido (Q17). Desvincular recorrente → S2-B4 (`DELETE .../relacao`). |

---

## GET /auth/confirmar-email

Confirma o e-mail do paciente após autocadastro.

**Autenticação:** não requerida

### Query params

| Param | Obrigatório | Descrição |
| --- | --- | --- |
| `token` | Sim | UUID do `Token_Email` (tipo `CONFIRMACAO_EMAIL`) |

### Resposta 200

```json
{
  "data": { "mensagem": "E-mail confirmado com sucesso." },
  "message": "E-mail confirmado com sucesso."
}
```

### Erros

| Código | Motivo |
| --- | --- |
| `400` | Token inválido, expirado ou já utilizado |

---

## POST /auth/recuperar-senha

Solicita link de redefinição de senha. Resposta **sempre genérica** (RNF02).

**Autenticação:** não requerida

### Corpo

```json
{ "email": "paciente@email.com" }
```

### Resposta 200

```json
{
  "data": {
    "mensagem": "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha."
  }
}
```

---

## POST /auth/redefinir-senha

Aplica nova senha usando token de recuperação.

**Autenticação:** não requerida

### Corpo

```json
{
  "token": "uuid-do-token",
  "senha": "novaSenha123"
}
```

| Regra | Detalhe |
| --- | --- |
| Senha | Mínimo 8 caracteres (Q7) |
| Token | Tipo `RECUPERACAO_SENHA`, uso único, TTL 1h (padrão) |

---

## GET /dev/email-preview/{token} *(somente perfil `dev`)*

Preview do e-mail enviado — link de confirmação/recuperação para debug local.

**Autenticação:** pública (apenas com `spring.profiles.active=dev`)

---

### Testar rota protegida

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nutri@nutri4you.com","senha":"sua-senha"}' | jq -r '.data.token')

curl http://localhost:8080/api/v1/gestao-pacientes \
  -H "Authorization: Bearer $TOKEN"
```
