package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.TokenEmailRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TokenEmailService {

    public static final String MENSAGEM_TOKEN_INVALIDO = "Token inválido ou expirado.";

    private final TokenEmailRepository tokenEmailRepository;
    private final EmailProperties emailProperties;

    public TokenEmailService(TokenEmailRepository tokenEmailRepository, EmailProperties emailProperties) {
        this.tokenEmailRepository = tokenEmailRepository;
        this.emailProperties = emailProperties;
    }

    @Transactional
    public TokenEmail criarTokenConfirmacao(Paciente paciente) {
        return salvarTokenPaciente(paciente, TipoTokenEmail.CONFIRMACAO_EMAIL, emailProperties.getConfirmacaoTtlHoras());
    }

    @Transactional
    public TokenEmail criarTokenRecuperacao(Paciente paciente) {
        invalidarRecuperacaoPendente(paciente.getId(), null);
        return salvarTokenPaciente(paciente, TipoTokenEmail.RECUPERACAO_SENHA, emailProperties.getRecuperacaoTtlHoras());
    }

    @Transactional
    public TokenEmail criarTokenRecuperacao(Nutricionista nutricionista) {
        invalidarRecuperacaoPendente(null, nutricionista.getId());
        return salvarTokenNutricionista(
                nutricionista, TipoTokenEmail.RECUPERACAO_SENHA, emailProperties.getRecuperacaoTtlHoras());
    }

    @Transactional
    public TokenEmail consumirToken(UUID token, TipoTokenEmail tipoEsperado) {
        TokenEmail tokenEmail = tokenEmailRepository.findByTokenForUpdate(token)
                .orElseThrow(() -> new IllegalArgumentException(MENSAGEM_TOKEN_INVALIDO));

        validarEstado(tokenEmail, tipoEsperado);
        tokenEmail.marcarComoUsado();
        return tokenEmailRepository.save(tokenEmail);
    }

    @Transactional(readOnly = true)
    public TokenEmail validarToken(UUID token, TipoTokenEmail tipoEsperado) {
        TokenEmail tokenEmail = tokenEmailRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(MENSAGEM_TOKEN_INVALIDO));
        validarEstado(tokenEmail, tipoEsperado);
        return tokenEmail;
    }

    private void validarEstado(TokenEmail tokenEmail, TipoTokenEmail tipoEsperado) {
        if (tokenEmail.getTipo() != tipoEsperado || tokenEmail.isUsado() || tokenEmail.isExpirado()) {
            throw new IllegalArgumentException(MENSAGEM_TOKEN_INVALIDO);
        }
    }

    private void invalidarRecuperacaoPendente(Integer pacienteId, Integer nutricionistaId) {
        LocalDateTime agora = LocalDateTime.now();
        if (pacienteId != null) {
            tokenEmailRepository.invalidarTokensPendentesPaciente(
                    pacienteId, TipoTokenEmail.RECUPERACAO_SENHA, agora);
        }
        if (nutricionistaId != null) {
            tokenEmailRepository.invalidarTokensPendentesNutricionista(
                    nutricionistaId, TipoTokenEmail.RECUPERACAO_SENHA, agora);
        }
    }

    private TokenEmail salvarTokenPaciente(Paciente paciente, TipoTokenEmail tipo, long ttlHoras) {
        LocalDateTime expiraEm = LocalDateTime.now().plusHours(ttlHoras);
        TokenEmail tokenEmail = TokenEmail.criarParaPaciente(paciente, tipo, expiraEm);
        return tokenEmailRepository.save(tokenEmail);
    }

    private TokenEmail salvarTokenNutricionista(Nutricionista nutricionista, TipoTokenEmail tipo, long ttlHoras) {
        LocalDateTime expiraEm = LocalDateTime.now().plusHours(ttlHoras);
        TokenEmail tokenEmail = TokenEmail.criarParaNutricionista(nutricionista, tipo, expiraEm);
        return tokenEmailRepository.save(tokenEmail);
    }
}
