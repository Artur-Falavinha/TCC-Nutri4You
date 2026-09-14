# Modelo de relação paciente ↔ nutricionista

**Decisão Q11 (13/09/2026):** relação clínica **somente por eventos**. Sem `Vinculo_Nutricional`, sem nutri de referência.

## Princípio

Não existe entidade “vínculo” entre paciente e nutricionista. A relação é **derivada** de registros clínicos que **já carregam** `id_paciente` e `id_nutricionista` (ou derivam deles).

| Evento / registro | Liga paciente ↔ nutricionista? | Uso |
| --- | --- | --- |
| `Consulta` | Sim, direto | Agenda, atendimento, base do plano |
| `Plano_Alimentar` | Sim, via `Consulta` | Dieta com vigência (Sprint 4+) |
| `Pergunta_Anamnese` / `Resposta_Anamnese` | Sim, pergunta do nutri + resposta do paciente | Anamnese (Sprint 3+) |
| `Avaliacao_Antropometrica` | Sim, via consulta ou paciente+nutri | Medidas |
| `Exame` | Sim | Prescrição/resultado |
| Cadastro manual na gestão (Sprint 2) | Implícito até 1ª consulta | Nutri cria ficha; listagem MVP |

## Quem vê o quê

**Paciente:** histórico **completo** dele (todas consultas, planos, respostas).

**Nutricionista logado:** só pacientes e registros em que **ele participou** — filtro por `id_nutricionista` nos eventos acima.

**403:** nutricionista tenta acessar paciente/dado sem consulta, plano ou registro clínico **dele** para aquele paciente.

## Regras de produto

| Situação | Comportamento |
| --- | --- |
| Autocadastro | Sem nutricionista associado |
| Paciente consulta vários nutris | Permitido; cada um vê só os eventos dele |
| Paciente “troca de nutri” | Marca consulta com outro; **nada a desvincular** |
| Nutricionista “inativa” paciente | **Não** — não bloqueia login nem apaga conta |
| Nutricionista arquiva da lista | Filtro de UI (opcional Sprint 3+), sem efeito na conta |
| Vários planos alimentares | Vários no histórico; **1 dieta ativa** na home mobile (vigência) |
| Conta inativa global | Apenas admin/suporte (futuro HU019) |

## Listagem web do nutricionista

```sql
-- Pacientes "meus" (conceito derivado)
SELECT DISTINCT p.*
FROM Paciente p
WHERE EXISTS (
  SELECT 1 FROM Consulta c
  WHERE c.id_paciente = p.id_paciente
    AND c.id_nutricionista = :nutriLogado
)
-- Sprint 4+: OR EXISTS plano via consulta do nutri
-- Sprint 2 MVP: pacientes cadastrados pelo nutri na gestão (até existir consulta)
```

## Desvio do RoadMap

O RoadMap menciona “vínculo nutricional” e “inativar/reativar paciente”. Para o TCC:

- **Inativar** = encerrar **relação clínica** (consulta concluída, plano expirado), **não** bloquear login.
- **Autorização** = evento participado, não vínculo ATIVO.

Registrar alinhamento com orientador na Sprint Review.

## Schema

Tabela `Vinculo_Nutricional` **removida** de `database/init.sql` (14 tabelas). Seed de dev usa `Consulta` para ligar pacientes demo ao nutricionista seed.

## Referências

- [pesquisa-mercado-relacao-paciente-nutricionista.md](./pesquisa-mercado-relacao-paciente-nutricionista.md)
- [spec 002](../../specs/002-sprint2-auth/decisions.md) Q11
