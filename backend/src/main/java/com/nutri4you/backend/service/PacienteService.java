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

import java.util.regex.Pattern;

@Service
public class PacienteService {

    private static final Pattern FORMATO_CPF = Pattern.compile("(?:[0-9]{11}|[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2})");

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

        String cpf = validarCpfCadastro(dto.cpf());
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

    private static String validarCpfCadastro(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return null;
        }

        if (!FORMATO_CPF.matcher(cpf.strip()).matches()) {
            throw new IllegalArgumentException("CPF inválido.");
        }

        String digitos = Paciente.normalizarCpf(cpf);
        if (digitos.chars().allMatch(digito -> digito == digitos.charAt(0))
                || digitoVerificador(digitos, 9) != digitos.charAt(9) - '0'
                || digitoVerificador(digitos, 10) != digitos.charAt(10) - '0') {
            throw new IllegalArgumentException("CPF inválido.");
        }
        return digitos;
    }

    private static int digitoVerificador(String cpf, int quantidade) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) {
            soma += (cpf.charAt(i) - '0') * (quantidade + 1 - i);
        }
        int digito = 11 - soma % 11;
        return digito >= 10 ? 0 : digito;
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
