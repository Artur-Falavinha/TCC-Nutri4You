package com.nutri4you.backend.service;

import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthEmailService {

    private static final String MENSAGEM_RECUPERACAO =
            "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.";

    private final PacienteRepository pacienteRepository;
    private final NutricionistaRepository nutricionistaRepository;
    private final TokenEmailService tokenEmailService;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;

    public AuthEmailService(
            PacienteRepository pacienteRepository,
            NutricionistaRepository nutricionistaRepository,
            TokenEmailService tokenEmailService,
            EmailNotificationService emailNotificationService,
            PasswordEncoder passwordEncoder) {
        this.pacienteRepository = pacienteRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.tokenEmailService = tokenEmailService;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void confirmarEmail(UUID token) {
        TokenEmail tokenEmail = tokenEmailService.consumirToken(token, TipoTokenEmail.CONFIRMACAO_EMAIL);
        Paciente paciente = tokenEmail.getPaciente();
        if (paciente == null) {
            throw new IllegalArgumentException(TokenEmailService.MENSAGEM_TOKEN_INVALIDO);
        }
        paciente.setEmailConfirmado(true);
        pacienteRepository.save(paciente);
    }

    public String solicitarRecuperacaoSenha(String email) {
        if (email != null && !email.isBlank()) {
            String emailNormalizado = email.trim().toLowerCase();
            nutricionistaRepository.findByEmailIgnoreCase(emailNormalizado)
                    .ifPresentOrElse(
                            emailNotificationService::agendarRecuperacaoSenha,
                            () -> pacienteRepository.findByEmailIgnoreCase(emailNormalizado)
                                    .ifPresent(emailNotificationService::agendarRecuperacaoSenha));
        }
        return MENSAGEM_RECUPERACAO;
    }

    @Transactional
    public void redefinirSenha(UUID token, String novaSenha) {
        validarSenha(novaSenha);
        TokenEmail tokenEmail = tokenEmailService.consumirToken(token, TipoTokenEmail.RECUPERACAO_SENHA);

        if (tokenEmail.getPaciente() != null) {
            Paciente paciente = tokenEmail.getPaciente();
            paciente.setSenha(passwordEncoder.encode(novaSenha));
            paciente.setEmailConfirmado(true);
            pacienteRepository.save(paciente);
        } else if (tokenEmail.getNutricionista() != null) {
            Nutricionista nutricionista = tokenEmail.getNutricionista();
            nutricionista.setSenha(passwordEncoder.encode(novaSenha));
            nutricionistaRepository.save(nutricionista);
        } else {
            throw new IllegalArgumentException(TokenEmailService.MENSAGEM_TOKEN_INVALIDO);
        }
    }

    public static void validarSenha(String senha) {
        if (senha == null || senha.length() < 8) {
            throw new IllegalArgumentException("A senha deve ter no mínimo 8 caracteres.");
        }
    }

    public static String mensagemRecuperacao() {
        return MENSAGEM_RECUPERACAO;
    }
}
