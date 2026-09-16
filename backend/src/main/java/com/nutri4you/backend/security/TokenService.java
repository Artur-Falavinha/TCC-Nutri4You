package com.nutri4you.backend.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;

@Service
public class TokenService {

    private static final String ISSUER = "API Nutri4You";
    static final String DEV_DEFAULT_SECRET = "dev-only-change-this-secret-nutri4you";

    private final String secret;
    private final long expirationHours;
    private final Environment environment;

    public TokenService(
            @Value("${api.security.token.secret}") String secret,
            @Value("${api.security.token.expiration-hours:2}") long expirationHours,
            Environment environment) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("O segredo JWT não pode ser vazio");
        }
        if (expirationHours <= 0) {
            throw new IllegalArgumentException("A validade do token deve ser positiva");
        }
        this.secret = secret;
        this.expirationHours = expirationHours;
        this.environment = environment;
    }

    @PostConstruct
    void validarSegredoForaDeDevOuTeste() {
        if (permiteSegredoPadrao()) {
            return;
        }
        if (DEV_DEFAULT_SECRET.equals(secret)) {
            throw new IllegalStateException(
                    "JWT_SECRET deve ser definido via variável de ambiente em ambientes não-dev.");
        }
    }

    private boolean permiteSegredoPadrao() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> profile.equals("dev") || profile.equals("test"));
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