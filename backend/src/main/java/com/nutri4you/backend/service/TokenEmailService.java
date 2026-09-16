package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
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

    private final TokenEmailRepository tokenEmailRepository;
    private final EmailProperties emailProperties;

    public TokenEmailService(TokenEmailRepository tokenEmailRepository, EmailProperties emailProperties) {
        this.tokenEmailRepository = tokenEmailRepository;
        this.emailProperties = emailProperties;
    }

    @Transactional
    public TokenEmail criarTokenConfirmacao(Paciente paciente) {
        return salvarToken(paciente, TipoTokenEmail.CONFIRMACAO_EMAIL, emailProperties.getConfirmacaoTtlHoras());
    }

    @Transactional
    public TokenEmail criarTokenRecuperacao(Paciente paciente) {
        return salvarToken(paciente, TipoTokenEmail.RECUPERACAO_SENHA, emailProperties.getRecuperacaoTtlHoras());
    }

    @Transactional(readOnly = true)
    public TokenEmail validarToken(UUID token, TipoTokenEmail tipoEsperado) {
        TokenEmail tokenEmail = tokenEmailRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido ou expirado."));

        if (tokenEmail.getTipo() != tipoEsperado) {
            throw new IllegalArgumentException("Token inválido ou expirado.");
        }
        if (tokenEmail.isUsado()) {
            throw new IllegalArgumentException("Token já utilizado.");
        }
        if (tokenEmail.isExpirado()) {
            throw new IllegalArgumentException("Token expirado.");
        }
        return tokenEmail;
    }

    @Transactional
    public void marcarComoUsado(TokenEmail tokenEmail) {
        tokenEmail.marcarComoUsado();
        tokenEmailRepository.save(tokenEmail);
    }

    private TokenEmail salvarToken(Paciente paciente, TipoTokenEmail tipo, long ttlHoras) {
        LocalDateTime expiraEm = LocalDateTime.now().plusHours(ttlHoras);
        TokenEmail tokenEmail = TokenEmail.criar(paciente, tipo, expiraEm);
        return tokenEmailRepository.save(tokenEmail);
    }
}
