package com.nutri4you.backend.service;

import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoTokenEmail;
import com.nutri4you.backend.model.TokenEmail;
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
    private final TokenEmailService tokenEmailService;
    private final EmailNotificationService emailNotificationService;
    private final PasswordEncoder passwordEncoder;

    public AuthEmailService(
            PacienteRepository pacienteRepository,
            TokenEmailService tokenEmailService,
            EmailNotificationService emailNotificationService,
            PasswordEncoder passwordEncoder) {
        this.pacienteRepository = pacienteRepository;
        this.tokenEmailService = tokenEmailService;
        this.emailNotificationService = emailNotificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void confirmarEmail(UUID token) {
        TokenEmail tokenEmail = tokenEmailService.validarToken(token, TipoTokenEmail.CONFIRMACAO_EMAIL);
        Paciente paciente = tokenEmail.getPaciente();
        paciente.setEmailConfirmado(true);
        pacienteRepository.save(paciente);
        tokenEmailService.marcarComoUsado(tokenEmail);
    }

    @Transactional(readOnly = true)
    public String solicitarRecuperacaoSenha(String email) {
        if (email != null && !email.isBlank()) {
            pacienteRepository.findByEmail(email.trim().toLowerCase())
                    .ifPresent(emailNotificationService::enviarRecuperacaoSenha);
        }
        return MENSAGEM_RECUPERACAO;
    }

    @Transactional
    public void redefinirSenha(UUID token, String novaSenha) {
        validarSenha(novaSenha);
        TokenEmail tokenEmail = tokenEmailService.validarToken(token, TipoTokenEmail.RECUPERACAO_SENHA);
        Paciente paciente = tokenEmail.getPaciente();
        paciente.setSenha(passwordEncoder.encode(novaSenha));
        paciente.setEmailConfirmado(true);
        pacienteRepository.save(paciente);
        tokenEmailService.marcarComoUsado(tokenEmail);
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
