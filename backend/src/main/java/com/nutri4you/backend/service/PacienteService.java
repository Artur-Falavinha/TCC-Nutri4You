package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PacienteCadastroDTO;
import com.nutri4you.backend.exception.CpfEmUsoException;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.TipoCadastro;
import com.nutri4you.backend.repository.PacienteRepository;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
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

        String cpf = Paciente.normalizarCpf(dto.cpf());
        if (cpf == null && dto.cpf() != null && !dto.cpf().isBlank()) {
            throw new IllegalArgumentException("CPF inválido.");
        }
        if (cpf != null && pacientes.existsByCpf(cpf)) {
            throw new CpfEmUsoException();
        }

        Paciente paciente = new Paciente(dto.nome().trim(), cpf, dto.dataNascimento(), dto.sexo(), dto.telefone(),
                email, passwordEncoder.encode(dto.senha()));
        paciente.setEmailConfirmado(true);
        Paciente cadastrado = salvarPaciente(paciente);
        privacidade.aceitar(cadastrado, dto.versaoTermos());
        return cadastrado;
    }

    private Paciente salvarPaciente(Paciente paciente) {
        try {
            return pacientes.saveAndFlush(paciente);
        } catch (DataIntegrityViolationException erro) {
            if (erro.getCause() instanceof ConstraintViolationException violacao
                    && Paciente.RESTRICAO_CPF_UNICO.equals(violacao.getConstraintName())) {
                throw new CpfEmUsoException();
            }
            throw erro;
        }
    }
}
