# Sprint 2 — Estratégia de e-mail (confirmação e recuperação de senha)

Decisão do grilling Q2 (13/09/2026). Spec: [`specs/002-sprint2-auth/`](../../specs/002-sprint2-auth/spec.md).

## Objetivo

Implementar fluxos de confirmação de e-mail e recuperação de senha com **adapter** trocável: console no dev local, **Mailtrap** na demo do TCC.

## Padrão adapter

```text
EmailSender (interface)
├── ConsoleEmailSender      → perfil dev (log + preview HTTP)
└── SmtpEmailSender         → perfil staging/prod (futuro)
```

Trocar mock por SMTP = **configuração + bean**, sem reescrever regras de negócio.

## Perfil `dev` (local)

| Comportamento | Detalhe |
| --- | --- |
| Token UUID | TTL configurável (ex.: 24h confirmação, 1h recuperação senha) |
| Log | Link completo no console do backend |
| Preview | `GET /api/v1/dev/email-preview/{token}` (somente perfil dev) |
| Confirmação | `GET /api/v1/auth/confirmar-email?token=` → `emailConfirmado=true` |
| Recuperação | `POST /auth/recuperar-senha` gera token (paciente **ou** nutricionista, Q26); `POST /auth/redefinir-senha` aplica nova senha |

## Perfil `demo` (Sprint Review / TCC)

**Mailtrap** como padrão — e-mails visíveis na caixa de testes durante a apresentação.

| Provedor | Uso |
| --- | --- |
| [Mailtrap](https://mailtrap.io/) | Demo TCC (recomendado) |
| [Brevo](https://www.brevo.com/) | Alternativa SMTP real (pós-TCC) |
| Gmail + app password | Só ambiente controlado |

Variáveis de ambiente (exemplo):

```properties
email.provider=smtp
spring.mail.host=smtp-relay.brevo.com
spring.mail.username=${EMAIL_USERNAME}
spring.mail.password=${EMAIL_PASSWORD}
email.from=noreply@nutri4you.local
```

## Segurança

- Tokens de uso único; consumo atômico (lock + update condicional) e invalidação de tokens de recuperação anteriores do mesmo titular.
- Persistência do token **antes** do envio; envio assíncrono (`@Async`) — falha SMTP/console **não** retorna 500 (RNF02).
- Respostas não revelam se e-mail existe (RNF02), exceto mensagem específica "confirme seu e-mail" **após** login com credenciais corretas (decisions Q7).
- `Token_Email` com titular XOR paciente **ou** nutricionista (Q27).
- Endpoint `/dev/email-preview` desabilitado fora do perfil `dev`.

## Referências

- [decisions.md Q2](../../specs/002-sprint2-auth/decisions.md)
- [autenticacao.md](../api/autenticacao.md)
