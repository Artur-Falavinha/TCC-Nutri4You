# Pesquisa de mercado — relação paciente ↔ nutricionista

**Data:** 13/09/2026 · Contexto: grilling Sprint 2 (Q11) · Nutri4You TCC

## Perguntas que motivaram a pesquisa

1. Apps usam vínculo fixo paciente–nutricionista ou só ponte por consulta?
2. Nutricionista vê tudo do paciente ou só o que participou?
3. Paciente pode consultar vários nutricionistas e ter vários planos ativos?

## Resumo executivo

| Padrão | Quem usa | Como funciona |
| --- | --- | --- |
| **Relação 1:1 (cadastro pelo nutri)** | Dietbox, WebDiet, Nutrium consultório | Nutricionista cadastra paciente; app do paciente mostra plano/materiais **daquele** profissional |
| **Troca de profissional** | Nutrium | Paciente confirma associação com **novo** nutri; app passa a exibir dados do novo (não fica preso ao anterior) |
| **Marketplace / agenda** | Nutrium Care | Paciente escolhe profissional da lista e **marca consulta** |
| **Clínica multi-profissional** | MealCircle, Nutritio, mealPlan.fit | Paciente **alocado** a um nutricionista; acesso **por escopo** (assignment + role) |
| **Prontuário exportável** | WebDiet | Continuidade via **export PDF**, não leitura cruzada automática entre nutris |

**Conclusão:** o mercado **não** usa um único modelo. Software de consultório brasileiro enfatiza relação contínua nutri↔paciente; plataformas de clínica e marketplace enfatizam **consulta/alocação + isolamento de dados por profissional**. Nenhum produto encontrado expõe ao nutricionista B o prontuário completo gerado pelo nutricionista A.

## Produtos analisados

### Dietbox (BR — líder)

- Nutricionista **cadastra** paciente no sistema ([Saúde Digital News](https://saudedigitalnews.com.br/21/08/2016/programa-de-nutricao-dietbox-facilita-relacionamento-de-nutricionistas-com-pacientes-e-agiliza-consultas/)).
- App paciente: plano, diário, chat, **agendamento**, alertas — tudo ligado ao profissional que prescreveu ([dietbox.me](https://dietbox.me/pt-BR)).
- Paciente **não** autocadastra plano; depende do nutricionista Dietbox.
- **Vínculo implícito:** relação comercial contínua nutri→paciente, não “só consulta avulsa”.

### WebDiet (BR)

- Prontuário **centralizado por paciente** no painel do nutricionista ([blog WebDiet](https://blog.webdiet.com.br/2026/05/29/entenda-o-webdiet-como-funciona/)).
- App paciente: prescrições, metas, diário — o que o **profissional liberou**.
- **Periodização alimentar:** paciente “sempre com o plano correto” da vigência atual ([webdiet.com.br](https://webdiet.com.br/)).
- Multiusuário para secretária, **não** para outro nutricionista ver prontuário alheio.
- Continuidade entre profissionais: **exportação PDF** do prontuário.

### Nutrium (global + BR)

- Modelo consultório: paciente convidado **após consulta**; plano e follow-up no app ([Play Store](https://play.google.com/store/apps/details?id=co.healthium.nutrium)).
- **Troca de nutricionista:** paciente confirma associação com novo profissional; app atualiza para o novo ([Help Center Nutrium](https://help.nutrium.com/en/articles/11419530-i-want-to-give-my-patient-access-to-the-app-but-they-re-still-linked-to-the-previous-professional)).
- **Nutrium Care (marketplace):** paciente pode agendar com profissional da lista; termos permitem serviços por **diferentes profissionais registrados** ([Termos Nutrium](https://nutrium.com/en/terms_and_conditions/clients)).
- App mobile do paciente tende a **um contexto ativo de profissional**, não dashboard multi-nutri simultâneo.

### MealCircle / Nutritio / mealPlan.fit (clínicas)

- Acesso **por assignment e role** — coach vê só pacientes atribuídos ([MealCircle HIPAA](https://mealcircle.co/hipaa-compliant-nutrition-software)).
- Paciente vê **seu** registro; logs e planos fluem para o profissional **daquela relação** ([Client Portal](https://mealcircle.co/dietitian-client-portal)).
- **Realocação** quando profissional sai da clínica ([mealPlan.fit](https://mealplan.fit/)).
- Multi-provider scheduling sem compartilhar prontuário entre nutris não relacionados.

## Respostas às perguntas do time

### 1. Vínculo fixo ou só consulta?

**Ambos existem no mercado**, conforme o produto:

- **Consultório (Dietbox/WebDiet):** relação contínua ≈ “meu nutricionista” (cadastro + acompanhamento).
- **Marketplace/agenda (Nutrium Care):** consulta primeiro, relação se forma depois.
- **Clínica:** alocação explícita (assignment), equivalente funcional a um vínculo administrativo.

Para TCC (decisão Q11): **`Consulta` + escopo por evento** — tabela `Vinculo_Nutricional` **removida** do schema.

### 2. Nutricionista vê consultas/dietas de outros?

**Não**, como regra de mercado e LGPD:

- Nutricionista A **não** vê anamnese/plano de A→B consultas.
- Paciente **sim** vê **seu** histórico agregado no app (todas as consultas, planos passados).
- Implementação típica: filtro `WHERE id_nutricionista = :logado` em consultas, planos, anamneses.

Isso valida a ideia do time: **eventos participados** definem visibilidade do profissional; **paciente** é dono do histórico completo.

### 3. Vários nutricionistas e vários planos alimentares?

**Risco real**, reconhecido pelo mercado. Mitigações comuns:

| Estratégia | Exemplo mercado |
| --- | --- |
| **Uma dieta ativa por vez** (global ou por profissional) | WebDiet periodização; Nutrium plano vigente na aba Meal Plan |
| **Vigência explícita** | Planos com data início/fim; mobile mostra só vigente |
| **Contexto por profissional no app** | Nutrium: ao trocar nutri, app muda contexto |
| **Arquivo histórico** | Planos expirados consultáveis pelo paciente, não prescritos ativamente |

**Recomendação Nutri4You:** paciente pode ter **N planos históricos**, mas **no máximo 1 dieta ativa** na home mobile (regra de negócio + campo `status`/`vigencia_fim` em `Plano_Alimentar`). Se consultar dois nutris em paralelo, UI deixa escolher qual plano seguir ou prioriza o de vigência mais recente.

## Implicações para Q11 (proposta)

Modelo alinhado ao mercado **sem** vínculo fixo exclusivo:

```text
Paciente (conta única, histórico completo)
    ├── Consulta (paciente + nutricionista + data/status)
    ├── Plano_Alimentar (autor nutricionista + vigência)
    └── Anamnese / medidas (escopo: nutricionista da consulta/plano)

Nutricionista logado → vê pacientes com ≥1 Consulta ou Plano_Alimentar publicado por ele
                   → vê só registros clínicos da relação dele com aquele paciente

Paciente logado   → vê timeline agregada; dieta ativa = regra de vigência
```

**Sprint 2 MVP:** gestão manual (nutri cadastra/edita paciente); sem inativar conta; autorização fina Sprint 3; agenda mobile Sprint 6.

**Desvio RoadMap:** “inativar/reativar paciente” → reinterpretar como **encerrar relação clínica** (consulta/plano), não bloquear login — alinhar com orientador.

## Fontes

- [Dietbox — site oficial](https://dietbox.me/pt-BR)
- [Nutrium — troca de profissional](https://help.nutrium.com/en/articles/11419530-i-want-to-give-my-patient-access-to-the-app-but-they-re-still-linked-to-the-previous-professional)
- [Nutrium — termos clientes](https://nutrium.com/en/terms_and_conditions/clients)
- [WebDiet — prontuário e app](https://blog.webdiet.com.br/2026/05/29/entenda-o-webdiet-como-funciona/)
- [MealCircle — HIPAA e escopo](https://mealcircle.co/hipaa-compliant-nutrition-software)
- [mealPlan.fit — alocação de clientes](https://mealplan.fit/)

Relacionado: [modelo-relacao-paciente-nutricionista.md](./modelo-relacao-paciente-nutricionista.md) · [spec 002](../../specs/002-sprint2-auth/spec.md)
