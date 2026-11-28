# Referência de endpoints

Base URL: `http://localhost:8080/api/v1`

---

## Datas e horários

Os campos de entrada de data, no JSON e nos parâmetros de consulta, aceitam `dd/mm/aaaa` ou `aaaa-mm-dd`. Os campos de data e hora locais aceitam `dd/mm/aaaa HH:mm`, com segundos opcionais, e o formato ISO usado nos exemplos abaixo. Uma data impossível, como `31/02/2026`, retorna HTTP 400.

As respostas mantêm o formato ISO para preservar a compatibilidade. Datas sem hora representam o dia do calendário, e os horários de consulta seguem o fuso da clínica, `America/Sao_Paulo`.

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

Autentica um paciente ou nutricionista e retorna um token JWT. O acesso exige o e-mail confirmado e um aceite dos termos registrado. A API preserva a data e a versão de aceites anteriores.

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

## POST /cadastros/iniciar

Envie `email` e `tipoUsuario` (`PACIENTE` ou `NUTRICIONISTA`). Para um endereço disponível, o endpoint inicia uma solicitação temporária, envia o e-mail de confirmação e responde `202`.

No fluxo `PACIENTE`, um endereço que já tem conta retorna `409` com o código `EMAIL_EM_USO`. O fluxo `NUTRICIONISTA` mantém a resposta genérica `202` para endereços cadastrados.

## POST /cadastros/confirmar

Envie o `token` recebido no e-mail. O mobile informa também `tipoUsuario: "PACIENTE"` para aceitar apenas códigos de paciente. A resposta `200` traz `email`, `tipoUsuario` e `expiraEm`. A confirmação libera 30 minutos para concluir o cadastro.

## POST /pacientes/autocadastro

Cria a conta após confirmar o endereço. Envie o mesmo e-mail e token da confirmação e informe a versão dos termos aceita no cadastro.

```json
{
  "nome": "Maria Silva",
  "email": "maria@example.test",
  "senha": "senhaSegura123",
  "tokenCadastro": "550e8400-e29b-41d4-a716-446655440000",
  "versaoTermos": "2026-11-22"
}
```

CPF, telefone, sexo e data de nascimento são opcionais. A data de nascimento aceita `dd/mm/aaaa` e `aaaa-mm-dd`. A resposta `201` indica que a conta está pronta para login.

## POST /nutricionistas/autocadastro

Cria a conta após confirmar o endereço. No aceite dos termos, o nutricionista declara a validade do CRN informado. A API checa a duplicidade do número no Nutri4You.

```json
{
  "nome": "Novo Nutricionista",
  "email": "novo@example.test",
  "senha": "senhaSegura123",
  "crn": "CRN8-54321",
  "crnDeclarado": true,
  "tokenCadastro": "550e8400-e29b-41d4-a716-446655440000",
  "versaoTermos": "2026-11-22"
}
```

A resposta `201` indica que a conta está pronta para login. Código inválido, expirado, usado ou de outro perfil retorna `400`.

## POST /nutricionistas/cadastro

Cadastro assistido com o mesmo corpo e a mesma confirmação prévia do autocadastro. Exige um JWT com `ROLE_NUTRICIONISTA`.

## GET /privacidade/termos

Abre o PDF público da versão atual. Para abrir uma edição específica, use `GET /privacidade/termos/{versao}`.

## GET /privacidade/me/termos

Consulta o aceite mais recente do usuário autenticado. A resposta inclui `versao`, `aceito` e `aceitoEm`.

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

## GET /usuarios/me/perfil

Dados pessoais do paciente autenticado. O e-mail é somente leitura.

**Autenticação:** JWT de paciente

### Perfil — resposta 200

```json
{
  "data": {
    "id": 2,
    "nome": "Arthur Henrique Deretti",
    "email": "arthur@email.com",
    "telefone": "41999999999",
    "sexo": "Masculino",
    "dataNascimento": "2000-01-01"
  },
  "message": "Perfil carregado."
}
```

### Perfil — erros

| Código | Motivo |
| --- | --- |
| `403` | Token de nutricionista ou ausente |

---

## PUT /usuarios/me

Paciente atualiza nome, telefone, sexo e data de nascimento. O e-mail não muda.

**Autenticação:** JWT de paciente

### Atualização do próprio perfil — corpo

```json
{
  "nome": "Nome Atualizado",
  "telefone": "41988887777",
  "sexo": "Masculino",
  "dataNascimento": "1990-05-20"
}
```

### Atualização do próprio perfil — erros

| Código | Motivo |
| --- | --- |
| `400` | Nome ausente |
| `403` | Token de nutricionista ou ausente |

---

## GET /usuarios/me/nutricionistas

Lista nutricionistas com relação clínica recorrente **ATIVA** do paciente autenticado.

**Autenticação:** JWT de paciente

### Nutricionistas vinculados — resposta 200

```json
{
  "data": [
    { "id": 1, "nome": "Gabriel de Paula Brasil", "email": "nutri@nutri4you.com" }
  ],
  "message": "Nutricionistas vinculados."
}
```

---

## DELETE /usuarios/me/nutricionistas/{idNutricionista}/relacao

Paciente encerra relação clínica recorrente com um nutricionista (Q17).

**Autenticação:** JWT de paciente

### Desvincular paciente — resposta 200

```json
{
  "data": { "mensagem": "Relação recorrente encerrada com sucesso." },
  "message": "Relação recorrente encerrada com sucesso."
}
```

### Desvincular paciente — erros

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

### Busca — query params

| Param | Obrigatório | Descrição |
| --- | --- | --- |
| `email` | Um de `email` ou `cpf` | E-mail do paciente (case-insensitive) |
| `cpf` | Um de `email` ou `cpf` | CPF com ou sem máscara |

### Busca — resposta 200

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

### Busca — erros

| Código | Motivo |
| --- | --- |
| `400` | Nenhum ou ambos os parâmetros informados |
| `404` | Paciente não encontrado |

---

## GET /gestao-pacientes/{id}

Busca paciente por ID. Exige relação clínica ativa ou consulta com o nutricionista logado. Nome, telefone, sexo e data de nascimento são somente leitura: quem altera esses campos é o paciente em `PUT /usuarios/me`.

**Autenticação:** `ROLE_NUTRICIONISTA`

### Detalhe gestão — erros

| Código | Motivo |
| --- | --- |
| `403` | Paciente existe, mas nutricionista sem acesso |
| `404` | ID inexistente |

---

## POST /gestao-pacientes/{id}/vincular

Cria ou reativa relação clínica recorrente entre nutricionista logado e paciente (Q17).

**Autenticação:** `ROLE_NUTRICIONISTA`

### Vincular — resposta 200

```json
{
  "data": { "mensagem": "Paciente vinculado com sucesso." },
  "message": "Paciente vinculado com sucesso."
}
```

### Vincular — erros

| Código | Motivo |
| --- | --- |
| `404` | Paciente inexistente |

---

## DELETE /gestao-pacientes/{id}/relacao

Nutricionista encerra relação clínica recorrente com o paciente (Q17).

**Autenticação:** `ROLE_NUTRICIONISTA`

### Desvincular nutri — resposta 200

```json
{
  "data": { "mensagem": "Relação recorrente encerrada com sucesso." },
  "message": "Relação recorrente encerrada com sucesso."
}
```

### Desvincular nutri — erros

| Código | Motivo |
| --- | --- |
| `400` | Relação ativa inexistente |

---

## Rotas removidas (S2-B1)

| Rota | Motivo |
| --- | --- |
| `DELETE /gestao-pacientes/{id}` | Soft delete removido (Q17). Desvincular recorrente → S2-B4 (`DELETE .../relacao`). |
| `PUT /gestao-pacientes/{id}` | Dados pessoais são do paciente (`PUT /usuarios/me`). O nutricionista apenas visualiza. |

---

## GET /gestao-pacientes/{id}/historico

Consultas do nutricionista com o paciente e avaliações antropométricas, mais recentes primeiro. Lista vazia quando não há registros.

**Autenticação:** `ROLE_NUTRICIONISTA` com relação clínica ou consulta

### Histórico — resposta 200

```json
{
  "data": {
    "consultas": [
      { "id": 1, "pacienteNome": "Arthur Henrique Deretti", "dataHora": "2026-09-30T10:00:00" }
    ],
    "avaliacoes": [
      {
        "id": 1,
        "dataAvaliacao": "2026-09-30",
        "peso": 80.00,
        "altura": 1.80,
        "imc": 24.69,
        "razaoCinturaQuadril": 0.80
      }
    ]
  },
  "message": "Histórico carregado."
}
```

### Histórico — erros

| Código | Motivo |
| --- | --- |
| `403` | Nutricionista sem acesso ao paciente |
| `404` | Paciente inexistente |

---

## GET /gestao-pacientes/{id}/avaliacoes

Lista avaliações antropométricas do paciente, mais recentes primeiro.

**Autenticação:** `ROLE_NUTRICIONISTA` com relação clínica ou consulta

---

## POST /gestao-pacientes/{id}/avaliacoes

Registra medidas. `id_consulta` não é obrigatório. IMC = peso / altura². Razão cintura/quadril só quando as duas medidas existem. Percentual de gordura e massa muscular, quando enviados, são valores medidos.

**Autenticação:** `ROLE_NUTRICIONISTA` com relação clínica ou consulta

### Avaliação — corpo

```json
{
  "peso": 80,
  "altura": 1.80,
  "circunferenciaCintura": 80,
  "circunferenciaQuadril": 100
}
```

| Campo | Regra |
| --- | --- |
| `peso` | Obrigatório, 1 a 500 kg |
| `altura` | Obrigatório, 0,30 a 2,70 m |

### Avaliação — erros

| Código | Motivo |
| --- | --- |
| `400` | Peso ou altura fora da faixa |
| `403` | Nutricionista sem acesso |
| `404` | Paciente inexistente |

---

## GET /dashboard/consultas

Consultas já persistidas do nutricionista. Não cria consulta.

- `hoje`: consultas do dia, com hora e nome.
- `semana`: segunda a domingo da semana corrente, com a quantidade de cada dia. `totalSemana` é a soma.
- `sexo`: pacientes visíveis (relação ativa ou consulta), fatias Masculino e Feminino. "Não informado" só entra se houver outro valor.
- `faixaEtaria`: as mesmas pessoas nas faixas `10–19` até `80+`. Sem data de nascimento, a pessoa fica de fora.
- `ultimos12Meses`: um ponto por mês, do mais antigo ao atual. `totalConsultas12Meses` é a soma.

**Autenticação:** `ROLE_NUTRICIONISTA`

### Agenda — resposta 200

```json
{
  "data": {
    "hoje": [
      { "id": 1, "pacienteNome": "Ana Paula Souza", "dataHora": "2026-09-30T08:00:00" }
    ],
    "semana": [
      { "rotulo": "Seg", "quantidade": 2 }
    ],
    "totalSemana": 11,
    "sexo": [
      { "rotulo": "Masculino", "quantidade": 4 },
      { "rotulo": "Feminino", "quantidade": 6 }
    ],
    "faixaEtaria": [
      { "rotulo": "20–29", "quantidade": 3 }
    ],
    "ultimos12Meses": [
      { "rotulo": "out", "quantidade": 1 }
    ],
    "totalConsultas12Meses": 18
  },
  "message": "Agenda carregada."
}
```

---

## POST /auth/confirmar-email

O link do e-mail abre a página de confirmação do web. Ao selecionar **Confirmar e-mail**, a página envia o token e apresenta a próxima ação para o paciente ou nutricionista. O token expira e pode ser usado uma vez.

**Autenticação:** não requerida

### Confirmar e-mail — corpo

Envie `token` no corpo JSON com o UUID do `Token_Email` de tipo `CONFIRMACAO_EMAIL`.

### Confirmar e-mail — resposta 200

```json
{
  "data": { "mensagem": "E-mail confirmado com sucesso.", "tipoUsuario": "NUTRICIONISTA" },
  "message": "E-mail confirmado com sucesso."
}
```

### Confirmar e-mail — erros

| Código | Motivo |
| --- | --- |
| `400` | `Token inválido ou expirado.` *(mensagem unificada — Q7)* |

O GET anterior continua aceitando `?token=…` para clientes JSON. No navegador, o mesmo link abre a página de confirmação.

---

## POST /auth/recuperar-senha

Solicita link de redefinição de senha para **paciente ou nutricionista** (Q26). Resposta **sempre genérica** (RNF02).

**Autenticação:** não requerida

| Lookup | Ordem |
| --- | --- |
| E-mail cadastrado | Nutricionista primeiro, depois paciente (mesma ordem do login) |

### Recuperar senha — corpo

```json
{ "email": "usuario@email.com" }
```

### Recuperar senha — resposta 200

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

### Redefinir senha — corpo

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
| Titular | `Token_Email` referencia paciente **ou** nutricionista (Q27) |
| Side-effect | Redefinir senha de paciente não confirmado também confirma o e-mail (Q19); nutricionista só atualiza a senha (Q28) |

### Redefinir senha — erros

| Código | Motivo |
| --- | --- |
| `400` | `Token inválido ou expirado.` *(inexistente, expirado, já usado ou tipo incorreto)* |
| `400` | Senha com menos de 8 caracteres |

> Falha no envio de e-mail em `recuperar-senha` **não** retorna 500 — resposta genérica 200 (RNF02).

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
