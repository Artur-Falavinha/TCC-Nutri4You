# ADR 002 — Autenticação JWT stateless com Spring Security

**Status:** Aceito  
**Data:** 2026-09

## Contexto

O sistema possui dois tipos de usuário (paciente e nutricionista) que acessam a API a partir de clientes web e mobile. Era necessário um mecanismo de autenticação que:

- Funcione sem sessão server-side (escalável para mobile).
- Diferencie roles para autorização futura.
- Integre nativamente com Spring Security.

## Decisão

Implementar autenticação **JWT stateless** com:

- Biblioteca Auth0 `java-jwt` 4.4.0.
- Algoritmo HMAC256, issuer `API Nutri4You`, subject = e-mail.
- Expiração configurável via `JWT_EXPIRATION_HOURS` (padrão 2h).
- `SecurityFilter` como `OncePerRequestFilter` antes do `UsernamePasswordAuthenticationFilter`.
- Entidades `Paciente` e `Nutricionista` implementando `UserDetails`.
- Senhas com BCrypt.

Rotas públicas na Sprint 1: login, autocadastro de paciente e health check.

## Emenda — Sprint 2 (2026-09)

- Rotas públicas ampliadas: confirmação/recuperação de senha, preview de e-mail (perfil `dev`), `POST /nutricionistas/autocadastro` (Q29).
- Web envia JWT via `authInterceptor` + `TokenStorageService` (S2-W1). Mobile ainda pendente (S2-M1).
- CORS configurado para origens do Angular em desenvolvimento.

## Consequências

### Positivas

- Sem estado de sessão no servidor — adequado para API REST e mobile.
- Token portável entre web e mobile.
- Roles prontas para `@PreAuthorize` em endpoints futuros.

### Trade-offs

- Sem refresh token — expiração exige novo login.
- Segredo JWT com default de desenvolvimento — deve ser sobrescrito em produção.

## Referências

- `backend/src/main/java/com/nutri4you/backend/config/SecurityConfig.java`
- `backend/src/main/java/com/nutri4you/backend/security/`
- [docs/api/autenticacao.md](../../api/autenticacao.md)
