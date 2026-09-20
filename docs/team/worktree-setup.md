# Worktree — setup obrigatório (Nutri4You)

Complemento da skill **`speckit-worktree`**. Toda nova worktree deve receber a pasta **`specs/`** do hub, incluindo o mapa de skills.

A pasta `specs/` é **gitignored** — não sincroniza via `git pull`. A cópia é **manual/automática na criação da worktree**.

---

## Checklist ao criar worktree

Executar **na sequência** (agente ou integrante):

| # | Passo | Skill / ferramenta |
| --- | --- | --- |
| 1 | Branch a partir de `main` + `git worktree add` | `speckit-worktree` |
| 2 | Conta GitHub na worktree | `set-github-account.ps1` |
| 3 | Bootstrap Spec Kit se `.specify/` ausente | `specify init --here ...` |
| 4 | **Copiar `specs/` do hub → worktree** | **obrigatório — ver abaixo** |
| 5 | Nova sessão Cursor/Codex na pasta da worktree | — |

---

## Passo 4 — Copiar specs (inclui mapa de skills)

**Hub (origem):**

```text
C:\Users\artur.falavinha\projetoslocal\TCC-Nutri4You\specs\
```

**Destino:** raiz da worktree recém-criada.

### PowerShell

```powershell
$hub   = "C:\Users\artur.falavinha\projetoslocal\TCC-Nutri4You"
$wt    = "C:\Users\artur.falavinha\projetoslocal\_worktrees\TCC-Nutri4You\<branch-name>"

Copy-Item -Recurse -Force "$hub\specs" "$wt\specs"
```

Substituir `<branch-name>` pelo nome real (ex.: `003-sprint2-mobile-pacientes`).

### O que deve existir após a cópia

| Arquivo | Obrigatório | Função |
| --- | --- | --- |
| `specs/skills.md` | **Sim** | Mapa global — quando invocar cada skill |
| `specs/<NNN-feature>/spec.md` | Se spec ativa | Contrato da feature |
| `specs/<NNN-feature>/plan.md` | Recomendado | Plano de execução |
| `specs/<NNN-feature>/tasks.md` | Recomendado | Tasks |
| `specs/<NNN-feature>/decisions.md` | Recomendado | Grilling |

Se `specs/skills.md` **não existir no hub**, criar/atualizar no hub **antes** de copiar.

---

## Regra para o agente (`speckit-worktree`)

Ao executar **`speckit-worktree`** neste repositório:

1. **Sempre** rodar a cópia de `specs/` (passo 4) **antes** de encerrar a sessão.
2. Confirmar que `specs/skills.md` está presente na worktree.
3. Se a nova worktree for para feature `NNN`, garantir que `specs/NNN-.../` também foi copiada ou criada.
4. Informar ao usuário: *"Specs + mapa de skills copiados para a worktree."*

Não depender de git para este passo.

---

## Nova spec / feature

1. Criar pasta `specs/<NNN-nome>/` no **hub**.
2. Em `spec.md`, incluir seção **Skills** apontando para [`specs/skills.md`](../../specs/skills.md) *(caminho relativo dentro de specs/)*.
3. Na próxima worktree, a cópia recursiva de `specs/` leva tudo junto.

---

## Sincronização hub ↔ worktree (durante desenvolvimento)

| Direção | Quando | Como |
| --- | --- | --- |
| Hub → worktree | Início de frente / worktree nova | `Copy-Item -Recurse -Force` |
| Worktree → hub | Decisões de grilling, plan/tasks atualizados | Copiar de volta só arquivos alterados em `specs/` |

Contratos de API publicados vão em `docs/api/` *(versionado no git)*.

---

## Referências

- [README equipe](README.md) — regras globais
- Mapa de skills: `specs/skills.md` *(local, gitignored)*
- Skill: `speckit-worktree` em `.codex/skills/speckit-worktree/SKILL.md`
