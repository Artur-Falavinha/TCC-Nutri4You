package com.nutri4you.backend.service;

import com.nutri4you.backend.config.EmailProperties;
import com.nutri4you.backend.dto.PacienteCadastroDTO;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final NutricionistaRepository nutricionistaRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationService emailNotificationService;
    private final EmailProperties emailProperties;
    private final PrivacidadeService privacidade;

    public PacienteService(
            PacienteRepository pacienteRepository,
            NutricionistaRepository nutricionistaRepository,
            PasswordEncoder passwordEncoder,
            EmailNotificationService emailNotificationService,
            EmailProperties emailProperties, PrivacidadeService privacidade) {
        this.pacienteRepository = pacienteRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailNotificationService = emailNotificationService;
        this.emailProperties = emailProperties;
        this.privacidade = privacidade;
    }

    @Transactional
    public Paciente cadastrarPaciente(PacienteCadastroDTO dto) {
        if (dto == null || vazio(dto.nome()) || vazio(dto.email()) || vazio(dto.senha())) {
            throw new IllegalArgumentException("Nome, e-mail e senha são obrigatórios.");
        }

        AuthEmailService.validarSenha(dto.senha());
        PrivacidadeService.exigirVersao(dto.versaoTermos());

        String email = dto.email().trim().toLowerCase();
        if (pacienteRepository.existsByEmail(email) || nutricionistaRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("E-mail já está em uso no sistema.");
        }

        if (dto.cpf() != null && !dto.cpf().isBlank() && pacienteRepository.existsByCpf(dto.cpf())) {
            throw new IllegalArgumentException("CPF já está em uso no sistema.");
        }

        String senhaCriptografada = passwordEncoder.encode(dto.senha());
        Paciente novoPaciente = new Paciente(
                dto.nome().trim(),
                dto.cpf(),
                dto.dataNascimento(),
                dto.sexo(),
                dto.telefone(),
                email,
                senhaCriptografada);

        if (emailProperties.isAutoConfirm()) {
            novoPaciente.setEmailConfirmado(true);
        }

        Paciente salvo = pacienteRepository.save(novoPaciente);
        privacidade.aceitar(salvo, dto.versaoTermos());
        if (!emailProperties.isAutoConfirm()) {
            emailNotificationService.agendarConfirmacaoCadastro(salvo);
        }
        return salvo;
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}
