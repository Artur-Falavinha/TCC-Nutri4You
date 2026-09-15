package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PacienteCadastroDTO;
import com.nutri4you.backend.dto.PacienteResponseDTO;
import com.nutri4you.backend.dto.PacienteUpdateDTO;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final NutricionistaRepository nutricionistaRepository;
    private final PasswordEncoder passwordEncoder;

    public PacienteService(
            PacienteRepository pacienteRepository,
            NutricionistaRepository nutricionistaRepository,
            PasswordEncoder passwordEncoder) {
        this.pacienteRepository = pacienteRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Paciente cadastrarPaciente(PacienteCadastroDTO dto) {
        if (dto == null || vazio(dto.nome()) || vazio(dto.email()) || vazio(dto.senha())) {
            throw new IllegalArgumentException("Nome, e-mail e senha são obrigatórios.");
        }

        String email = dto.email().trim().toLowerCase();
        if (pacienteRepository.existsByEmail(email) || nutricionistaRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("E-mail já está em uso no sistema.");
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

        return pacienteRepository.save(novoPaciente);
    }

    public List<PacienteResponseDTO> listarTodos() {
        return pacienteRepository.findAll().stream()
                .map(this::paraResponse)
                .toList();
    }

    public PacienteResponseDTO buscarPorId(Integer id) {
        return pacienteRepository.findById(id)
                .map(this::paraResponse)
                .orElseThrow(PacienteNaoEncontradoException::new);
    }

    public PacienteResponseDTO atualizar(Integer id, PacienteUpdateDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Dados de atualização são obrigatórios.");
        }

        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(PacienteNaoEncontradoException::new);

        if (vazio(dto.nome())) {
            throw new IllegalArgumentException("Nome é obrigatório.");
        }

        paciente.setNome(dto.nome().trim());
        paciente.setTelefone(dto.telefone());
        paciente.setSexo(dto.sexo());
        paciente.setDataNascimento(dto.dataNascimento());

        return paraResponse(pacienteRepository.save(paciente));
    }

    private PacienteResponseDTO paraResponse(Paciente paciente) {
        return new PacienteResponseDTO(
                paciente.getId(),
                paciente.getNome(),
                paciente.getCpf(),
                paciente.getEmail(),
                paciente.getTelefone(),
                paciente.getSexo(),
                paciente.getDataNascimento());
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}
