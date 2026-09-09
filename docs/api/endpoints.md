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

## Rotas protegidas (Sprint 1)

Qualquer rota **não listada** como pública exige JWT válido. Na Sprint 1, apenas os três endpoints acima estão implementados; demais rotas retornarão `403 Forbidden` até serem desenvolvidas.

Para testar uma rota protegida futura:

```bash
curl http://localhost:8080/api/v1/exemplo \
  -H "Authorization: Bearer <token-do-login>"
```
