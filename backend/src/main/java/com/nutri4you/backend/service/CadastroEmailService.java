package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.model.CadastroPendente;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.CadastroPendenteRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class CadastroEmailService {

    static final String LINK_INVALIDO = "Código de cadastro inválido, expirado ou já utilizado.";
    private static final Duration INTERVALO_REENVIO = Duration.ofMinutes(1);
    private static final Duration PRAZO_CONCLUSAO = Duration.ofMinutes(30);

    private final CadastroPendenteRepository cadastros;
    private final ContasEmail contasEmail;
    private final EmailNotificationService notificacoes;
    private final EmailProperties emailProperties;
    private final Clock relogio;

    @PersistenceContext
    private EntityManager entidades;

    CadastroEmailService(CadastroPendenteRepository cadastros, ContasEmail contasEmail,
            EmailNotificationService notificacoes, EmailProperties emailProperties,
            Clock relogio) {
        this.cadastros = cadastros;
        this.contasEmail = contasEmail;
        this.notificacoes = notificacoes;
        this.emailProperties = emailProperties;
        this.relogio = relogio;
    }

    @Transactional
    public ResultadoInicio iniciar(String endereco, TipoCadastro tipoUsuario) {
        if (tipoUsuario == null) {
            throw new IllegalArgumentException("Informe o tipo de cadastro.");
        }
        String email = ContasEmail.normalizar(endereco);
        Instant agora = relogio.instant();
        cadastros.removerExpirados(agora);
        var existente = cadastros.findByEmail(email);
        if (contasEmail.emUso(email)) {
            return ResultadoInicio.EMAIL_EM_USO;
        }
        if (existente.filter(cadastro -> !cadastro.podeEnviar(agora, INTERVALO_REENVIO)).isPresent()) {
            return ResultadoInicio.ACEITO;
        }
        UUID token = UUID.randomUUID();
        CadastroPendente cadastro = existente.orElseGet(() -> new CadastroPendente(email));
        cadastro.prepararEnvio(tipoUsuario, hash(token), agora,
                agora.plus(Duration.ofHours(emailProperties.getConfirmacaoTtlHoras())));
        if (existente.isEmpty()) {
            entidades.persist(cadastro);
        }
        cadastros.flush();
        notificacoes.agendarInicioCadastro(email, tipoUsuario, token);
        return ResultadoInicio.ACEITO;
    }

    @Transactional
    public Confirmacao confirmar(UUID token, TipoCadastro tipoEsperado) {
        CadastroPendente cadastro = buscarValido(token, tipoEsperado);
        cadastro.confirmar(relogio.instant().truncatedTo(ChronoUnit.MICROS), PRAZO_CONCLUSAO);
        return new Confirmacao(cadastro.getEmail(), cadastro.getTipoUsuario(), cadastro.getExpiraEm());
    }

    @Transactional
    public String consumir(UUID token, TipoCadastro tipo, String endereco) {
        CadastroPendente cadastro = buscarValido(token, tipo);
        if (!cadastro.isConfirmado() || !cadastro.getEmail().equals(ContasEmail.normalizar(endereco))) {
            throw new IllegalArgumentException(LINK_INVALIDO);
        }
        String email = cadastro.getEmail();
        contasEmail.bloquearEscritas();
        if (contasEmail.emUso(email)) {
            throw new IllegalArgumentException("E-mail já está em uso no sistema.");
        }
        cadastros.delete(cadastro);
        return email;
    }

    private CadastroPendente buscarValido(UUID token, TipoCadastro tipoEsperado) {
        if (token == null) {
            throw new IllegalArgumentException(LINK_INVALIDO);
        }
        return cadastros.findByTokenHash(hash(token))
                .filter(cadastro -> !cadastro.expirou(relogio.instant()))
                .filter(cadastro -> tipoEsperado == null || tipoEsperado == cadastro.getTipoUsuario())
                .orElseThrow(() -> new IllegalArgumentException(LINK_INVALIDO));
    }

    static String hash(UUID token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.toString().getBytes(StandardCharsets.US_ASCII)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível.", exception);
        }
    }

    public enum ResultadoInicio {
        ACEITO,
        EMAIL_EM_USO
    }

    public record Confirmacao(String email, TipoCadastro tipoUsuario, Instant expiraEm) {
    }
}
