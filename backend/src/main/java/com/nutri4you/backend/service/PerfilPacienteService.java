package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NutricionistaVinculoDTO;
import com.nutri4you.backend.dto.PacientePerfilDTO;
import com.nutri4you.backend.dto.PacienteUpdateDTO;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PerfilPacienteService {

    private final PacienteRepository pacienteRepository;
    private final RelacaoClinicaRepository relacaoClinicaRepository;

    public PerfilPacienteService(
            PacienteRepository pacienteRepository,
            RelacaoClinicaRepository relacaoClinicaRepository) {
        this.pacienteRepository = pacienteRepository;
        this.relacaoClinicaRepository = relacaoClinicaRepository;
    }

    @Transactional(readOnly = true)
    public PacientePerfilDTO perfil(Paciente paciente) {
        return paraPerfil(paciente);
    }

    @Transactional
    public PacientePerfilDTO atualizar(Paciente paciente, PacienteUpdateDTO dto) {
        if (dto == null || dto.nome() == null || dto.nome().isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório.");
        }
        paciente.setNome(dto.nome().trim());
        paciente.setTelefone(dto.telefone() == null ? null : dto.telefone().trim());
        paciente.setSexo(dto.sexo() == null ? null : dto.sexo().trim());
        paciente.setDataNascimento(dto.dataNascimento());
        return paraPerfil(pacienteRepository.save(paciente));
    }

    @Transactional(readOnly = true)
    public List<NutricionistaVinculoDTO> nutricionistasAtivos(Paciente paciente) {
        return relacaoClinicaRepository
                .findByPaciente_IdAndStatus(paciente.getId(), StatusRelacaoClinica.ATIVA)
                .stream()
                .map(relacao -> new NutricionistaVinculoDTO(
                        relacao.getNutricionista().getId(),
                        relacao.getNutricionista().getNome(),
                        relacao.getNutricionista().getEmail()))
                .toList();
    }

    private PacientePerfilDTO paraPerfil(Paciente paciente) {
        return new PacientePerfilDTO(
                paciente.getId(),
                paciente.getNome(),
                paciente.getEmail(),
                paciente.getTelefone(),
                paciente.getSexo(),
                paciente.getDataNascimento());
    }
}
