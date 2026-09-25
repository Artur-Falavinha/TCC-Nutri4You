package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.TokenEmailRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenEmailServiceTest {

    @Mock
    private TokenEmailRepository tokenEmailRepository;

    @Mock
    private EmailProperties emailProperties;

    @InjectMocks
    private TokenEmailService tokenEmailService;

    @Test
    void consumirTokenExpiradoLancaMensagemUnificada() {
        UUID tokenId = UUID.randomUUID();
        Paciente paciente = new Paciente(
                "Paciente", "123", null, "M", null, "p@teste.com", "hash");
        TokenEmail tokenEmail = TokenEmail.criarParaPaciente(
                paciente, TipoTokenEmail.RECUPERACAO_SENHA, LocalDateTime.now().minusHours(1));

        when(tokenEmailRepository.findByTokenForUpdate(tokenId)).thenReturn(Optional.of(tokenEmail));

        assertThatThrownBy(() -> tokenEmailService.consumirToken(tokenId, TipoTokenEmail.RECUPERACAO_SENHA))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(TokenEmailService.MENSAGEM_TOKEN_INVALIDO);
    }

    @Test
    void consumirTokenValidoMarcaComoUsado() {
        UUID tokenId = UUID.randomUUID();
        Paciente paciente = new Paciente(
                "Paciente", "123", null, "M", null, "p@teste.com", "hash");
        TokenEmail tokenEmail = TokenEmail.criarParaPaciente(
                paciente, TipoTokenEmail.RECUPERACAO_SENHA, LocalDateTime.now().plusHours(1));

        when(tokenEmailRepository.findByTokenForUpdate(tokenId)).thenReturn(Optional.of(tokenEmail));
        when(tokenEmailRepository.save(any(TokenEmail.class))).thenAnswer(invocation -> invocation.getArgument(0));

        tokenEmailService.consumirToken(tokenId, TipoTokenEmail.RECUPERACAO_SENHA);

        verify(tokenEmailRepository).save(tokenEmail);
    }
}
