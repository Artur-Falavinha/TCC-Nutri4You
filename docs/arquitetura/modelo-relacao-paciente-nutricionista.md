# Modelo de relação paciente ↔ nutricionista

**Decisões:** Q11 (13/09) · Q16–Q18 (14/09) — ver [decisions.md Q11 e Round 5](../../specs/002-sprint2-auth/decisions.md).

## Princípio

Existem **dois modos** de relação clínica, complementares:

| Modo | O que é | Como nasce | O que desvincular encerra |
| --- | --- | --- | --- |
| **Consulta avulsa** | Atendimento pontual | `Consulta` entre paciente e nutricionista | Nada — histórico da consulta permanece |
| **Paciente recorrente** | Acompanhamento contínuo explícito | Nutricionista **vincula** paciente já cadastrado | `Relacao_Clinica` passa a `ENCERRADA` |

**Não** voltamos ao antigo `Vinculo_Nutricional`:

- Desvincular **não** bloqueia login do paciente.
- Desvincular **não** apaga conta nem soft delete em `Paciente`.
- Autorização clínica continua derivada de **eventos** (`Consulta`, plano, anamnese, etc.).

A tabela `Relacao_Clinica` registra apenas **preferência de acompanhamento recorrente** entre um par paciente ↔ nutricionista.

## O que cada modo agrega (produto)

### Consulta avulsa

- Paciente já tem conta (autocadastro).
- Nutricionista encontra o paciente (busca por e-mail/CPF), registra **uma consulta** e atende.
- Nutricionista vê o paciente na listagem **por causa da consulta**.
- Serve para: primeira consulta, segunda opinião, retorno único, paciente que consulta vários nutricionistas.

**Valor:** flexibilidade clínica sem “prender” paciente a um nutricionista.

### Paciente recorrente (vínculo explícito)

- Nutricionista **vincula** paciente que já existe no sistema.
- Paciente aparece no **painel recorrente** do nutricionista (dashboard web).
- Facilita: listagem estável, anamnese contínua, planos futuros, comunicação de acompanhamento.
- Paciente pode ter relação recorrente **ativa** com mais de um nutricionista (ex.: nutri esportivo + nutri clínico).

**Valor:** painel de “meus pacientes em acompanhamento”, distinto de consulta pontual.

### Cadastro de paciente pelo nutricionista — **fora do escopo Sprint 2**

| Cenário | Fluxo adotado |
| --- | --- |
| Paciente na consulta sem app | Paciente faz **autocadastro** no celular (rápido); nutricionista **busca** e **vincula** ou **inicia consulta** |
| Consulta marcada fora do app | Mesmo fluxo: conta nasce pelo paciente; nutricionista só opera sobre paciente **existente** |
| Paciente sem smartphone | Backlog futuro (convite por e-mail / cadastro assistido — **não** Sprint 2) |

**Motivo:** autocadastro já cobre o caso principal; criar conta pelo nutricionista duplica fluxo, senha temporária e suporte — baixo retorno na demo Sprint 2.

## Quem vê o quê

**Paciente (mobile):** histórico **completo** dele; vê nutricionistas com relação recorrente ativa ou consultas passadas; pode **desvincular** de um nutricionista recorrente (configurações/perfil).

**Nutricionista (web):** pacientes que atendem por:

1. `Relacao_Clinica` com `status = ATIVA`, **ou**
2. `Consulta` em que participou (inclui avulsas).

**403:** nutricionista acessa dado de paciente sem consulta, plano ou registro clínico **dele** para aquele paciente.

## Desvincular (Q17)

Substitui o antigo `DELETE /gestao-pacientes/{id}` (soft delete / inativar conta).

| Ator | Onde (UI) | Efeito |
| --- | --- | --- |
| Nutricionista | Gestão de pacientes | Encerra `Relacao_Clinica` **ativa** com aquele paciente |
| Paciente | Perfil / configurações (mobile) | Encerra relação recorrente com aquele nutricionista |

**Regras:**

- Modal de confirmação nos dois lados.
- Mesma regra de negócio; **dois endpoints** (autorização diferente).
- Consultas e histórico clínico **permanecem**.
- Conta do paciente **permanece** ativa.
- Se só existia consulta avulsa (sem `Relacao_Clinica`), desvincular recorrente não se aplica — paciente some da listagem “recorrentes”, mas pode permanecer em histórico de consultas.

### Endpoints previstos

| Método | Rota | Quem |
| --- | --- | --- |
| `POST` | `/api/v1/gestao-pacientes/{idPaciente}/vincular` | Nutricionista |
| `DELETE` | `/api/v1/gestao-pacientes/{idPaciente}/relacao` | Nutricionista |
| `DELETE` | `/api/v1/usuarios/me/nutricionistas/{idNutricionista}/relacao` | Paciente |

## Listagem web do nutricionista (Sprint 2)

```sql
SELECT DISTINCT p.*
FROM Paciente p
WHERE p.ativo = TRUE
  AND (
    EXISTS (
      SELECT 1 FROM Relacao_Clinica r
      WHERE r.id_paciente = p.id_paciente
        AND r.id_nutricionista = :nutriLogado
        AND r.status = 'ATIVA'
    )
    OR EXISTS (
      SELECT 1 FROM Consulta c
      WHERE c.id_paciente = p.id_paciente
        AND c.id_nutricionista = :nutriLogado
    )
  );
```

## Schema

| Tabela | Papel |
| --- | --- |
| `Consulta` | Evento clínico (avulso ou dentro de acompanhamento) |
| `Relacao_Clinica` | Acompanhamento recorrente explícito (`ATIVA` / `ENCERRADA`) |
| ~~`Vinculo_Nutricional`~~ | **Removida** (Q11) — não confundir com `Relacao_Clinica` |

### `Relacao_Clinica` (nova)

```sql
CREATE TABLE Relacao_Clinica (
    id_relacao SERIAL PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_nutricionista INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVA',  -- ATIVA | ENCERRADA
    iniciada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    encerrada_em TIMESTAMP,
    CONSTRAINT fk_rel_paciente FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente),
    CONSTRAINT fk_rel_nutri FOREIGN KEY (id_nutricionista) REFERENCES Nutricionista(id_nutricionista),
    CONSTRAINT uq_rel_par UNIQUE (id_paciente, id_nutricionista)
);
```

Reativar par encerrado: novo `INSERT` ou `UPDATE status = ATIVA` (definir na implementação S2-B4).

## Desvio do RoadMap

- **Inativar paciente** → encerrar **relação clínica recorrente** ou concluir consulta/plano — **não** bloquear login.
- **Vínculo nutricional** do RoadMap → reinterpretado como `Relacao_Clinica` + eventos, sem inativar conta.

Registrar alinhamento com orientador na Sprint Review.

## Referências

- [pesquisa-mercado-relacao-paciente-nutricionista.md](./pesquisa-mercado-relacao-paciente-nutricionista.md)
- [spec 002](../../specs/002-sprint2-auth/decisions.md)
- [sprint-02-alteracoes-escopo.md](../sprints/sprint-02-alteracoes-escopo.md)
