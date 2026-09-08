package com.nutri4you.backend.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class TokenService {

    private static final String ISSUER = "API Nutri4You";

    private final String secret;
    private final long expirationHours;

    public TokenService(
            @Value("${api.security.token.secret}") String secret,
            @Value("${api.security.token.expiration-hours:2}") long expirationHours) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("O segredo JWT não pode ser vazio");
        }
        if (expirationHours <= 0) {
            throw new IllegalArgumentException("A validade do token deve ser positiva");
        }
        this.secret = secret;
        this.expirationHours = expirationHours;
    }

    public String gerarToken(String email) {
        try {
            return JWT.create()
                    .withIssuer(ISSUER)
                    .withSubject(email)
                    .withExpiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS))
                    .sign(algorithm());
        } catch (JWTCreationException exception) {
            throw new IllegalStateException("Erro ao gerar token JWT", exception);
        }
    }

    public String validarToken(String token) {
        try {
            return JWT.require(algorithm())
                    .withIssuer(ISSUER)
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException | IllegalArgumentException exception) {
            return "";
        }
    }

    private Algorithm algorithm() {
        return Algorithm.HMAC256(secret);
    }
}