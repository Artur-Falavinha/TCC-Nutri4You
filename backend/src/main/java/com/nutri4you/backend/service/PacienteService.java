package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PacienteCadastroDTO;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PacienteService {

    private final PacienteRepository pacientes;
    private final PasswordEncoder passwordEncoder;
    private final PrivacidadeService privacidade;
    private final CadastroEmailService cadastroEmail;

    public PacienteService(PacienteRepository pacientes, PasswordEncoder passwordEncoder,
            PrivacidadeService privacidade, CadastroEmailService cadastroEmail) {
        this.pacientes = pacientes;
        this.passwordEncoder = passwordEncoder;
        this.privacidade = privacidade;
        this.cadastroEmail = cadastroEmail;
    }

    @Transactional
    public Paciente cadastrarPaciente(PacienteCadastroDTO dto) {
        if (dto.nome() == null || dto.nome().isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório.");
        }
        AuthEmailService.validarSenha(dto.senha());
        PrivacidadeService.exigirVersao(dto.versaoTermos());
        String email = cadastroEmail.consumir(dto.tokenCadastro(), TipoCadastro.PACIENTE, dto.email());

        if (dto.cpf() != null && !dto.cpf().isBlank() && pacientes.existsByCpf(dto.cpf())) {
            throw new IllegalArgumentException("CPF já está em uso no sistema.");
        }

        Paciente paciente = new Paciente(dto.nome().trim(), dto.cpf(), dto.dataNascimento(), dto.sexo(), dto.telefone(),
                email, passwordEncoder.encode(dto.senha()));
        paciente.setEmailConfirmado(true);
        Paciente cadastrado = pacientes.save(paciente);
        privacidade.aceitar(cadastrado, dto.versaoTermos());
        return cadastrado;
    }
}
