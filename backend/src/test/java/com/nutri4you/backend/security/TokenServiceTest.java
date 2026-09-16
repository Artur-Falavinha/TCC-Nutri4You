package com.nutri4you.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TokenServiceTest {

    @Test
    void aceitaSegredoPadraoNoPerfilDev() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("dev");

        TokenService service = new TokenService(
                TokenService.DEV_DEFAULT_SECRET, 2, environment);

        assertThatCode(service::validarSegredoForaDeDevOuTeste)
                .doesNotThrowAnyException();
    }

    @Test
    void rejeitaSegredoPadraoForaDeDevOuTeste() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("demo");

        assertThatThrownBy(() -> {
            TokenService service = new TokenService(
                    TokenService.DEV_DEFAULT_SECRET, 2, environment);
            service.validarSegredoForaDeDevOuTeste();
        }).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }
}
