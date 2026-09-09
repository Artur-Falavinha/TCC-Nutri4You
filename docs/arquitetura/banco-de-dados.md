# Banco de dados

O Nutri4You utiliza **PostgreSQL 16**. O schema completo está em `database/init.sql` e é aplicado automaticamente na primeira subida do container via volume Docker.

## Configuração de conexão

| Parâmetro | Valor (desenvolvimento) |
| --- | --- |
| Host | `localhost` / `127.0.0.1` |
| Porta | `5432` |
| Database | `nutri4you_db` |
| Usuário | `springuser` |
| Senha | `password` |

Spring Boot usa `SPRING_JPA_HIBERNATE_DDL_AUTO=none` — o schema **não** é gerado pelo Hibernate; apenas o SQL versionado é a fonte de verdade.

## Diagrama entidade-relacionamento (visão lógica)

```mermaid
erDiagram
    Nutricionista ||--o{ Vinculo_Nutricional : possui
    Paciente ||--o{ Vinculo_Nutricional : vinculado
    Nutricionista ||--o{ Pergunta_Anamnese : define
    Paciente ||--o{ Resposta_Anamnese : responde
    Pergunta_Anamnese ||--o{ Resposta_Anamnese : referencia
    Paciente ||--o{ Consulta : agenda
    Nutricionista ||--o{ Consulta : atende
    Consulta ||--o| Avaliacao_Antropometrica : gera
    Consulta ||--o| Plano_Alimentar : prescreve
    Plano_Alimentar ||--o| Lista_Compras : gera
    Lista_Compras ||--o{ Item_Lista_Compras : contem
    Plano_Alimentar ||--o{ Refeicao : organiza
    Refeicao ||--o{ Item_Refeicao : compoe
    Alimento ||--o{ Item_Refeicao : referencia
    Paciente ||--o{ Consumo_Diario : registra
    Paciente ||--o{ Exame : solicita
    Nutricionista ||--o{ Exame : prescreve
```

## Tabelas

| # | Tabela | Domínio | Entidade JPA |
| --- | --- | --- | --- |
| 1 | `Nutricionista` | Atores | Sim |
| 2 | `Paciente` | Atores | Sim |
| 3 | `Vinculo_Nutricional` | Relacionamento clínico | Não |
| 4 | `Pergunta_Anamnese` | Anamnese | Não |
| 5 | `Resposta_Anamnese` | Anamnese | Não |
| 6 | `Consulta` | Atendimento | Não |
| 7 | `Avaliacao_Antropometrica` | Antropometria | Não |
| 8 | `Exame` | Exames | Não |
| 9 | `Plano_Alimentar` | Prescrição | Não |
| 10 | `Lista_Compras` | Prescrição | Não |
| 11 | `Item_Lista_Compras` | Prescrição | Não |
| 12 | `Refeicao` | Prescrição | Não |
| 13 | `Consumo_Diario` | Acompanhamento mobile | Não |
| 14 | `Alimento` | Banco TACO | Não |
| 15 | `Item_Refeicao` | Prescrição | Não |

> Na Sprint 1, apenas `Paciente` e `Nutricionista` possuem entidades JPA mapeadas. As demais tabelas existem no DDL para suportar features futuras.

## Entidades JPA implementadas

### Paciente

| Coluna | Tipo | Constraints |
| --- | --- | --- |
| `id_paciente` | SERIAL | PK |
| `nome` | VARCHAR(150) | NOT NULL |
| `cpf` | VARCHAR(14) | UNIQUE |
| `data_nascimento` | DATE | — |
| `sexo` | VARCHAR(20) | — |
| `telefone` | VARCHAR(20) | — |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE |
| `senha` | VARCHAR(255) | NOT NULL |

Implementa `UserDetails` com authority `ROLE_PACIENTE`.

### Nutricionista

| Coluna | Tipo | Constraints |
| --- | --- | --- |
| `id_nutricionista` | SERIAL | PK |
| `nome` | VARCHAR(150) | NOT NULL |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE |
| `senha` | VARCHAR(255) | NOT NULL |
| `crn` | VARCHAR(20) | NOT NULL, UNIQUE |

Implementa `UserDetails` com authority `ROLE_NUTRICIONISTA`.

## Dados seed (mock)

O `init.sql` inclui dados iniciais para desenvolvimento:

| Recurso | Quantidade | Detalhe |
| --- | --- | --- |
| Nutricionistas | 1 | `nutri@nutri4you.com` |
| Pacientes | 2 | `arthur@email.com`, `artur@email.com` |
| Vínculos nutricionais | 2 | Status `ATIVO` |
| Alimentos (TACO) | 5 | Arroz, feijão, frango, ovo, banana |
| Perguntas de anamnese | 3 | Categorias Geral, Hábitos, Saúde |

## Trigger

A tabela `Resposta_Anamnese` possui trigger `trg_atualiza_timestamp_resposta` que atualiza `data_ultima_atualizacao` automaticamente em `UPDATE`.

## Estratégia de migrações

Atualmente o projeto usa um único script DDL (`init.sql`) montado no volume Docker. Para evoluções futuras, considerar:

- Flyway ou Liquibase para migrações incrementais.
- Separar DDL de seed em arquivos distintos.
- Scripts de rollback documentados.
