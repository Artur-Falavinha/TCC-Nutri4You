package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PacienteResumoDTO;
import com.nutri4you.backend.dto.PacienteResponseDTO;
import com.nutri4you.backend.dto.PacienteUpdateDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GestaoPacienteService {

    private final PacienteRepository pacienteRepository;
    private final RelacaoClinicaRepository relacaoClinicaRepository;
    private final ConsultaRepository consultaRepository;

    public GestaoPacienteService(
            PacienteRepository pacienteRepository,
            RelacaoClinicaRepository relacaoClinicaRepository,
            ConsultaRepository consultaRepository) {
        this.pacienteRepository = pacienteRepository;
        this.relacaoClinicaRepository = relacaoClinicaRepository;
        this.consultaRepository = consultaRepository;
    }

    @Transactional(readOnly = true)
    public List<PacienteResponseDTO> listarParaNutricionista(Nutricionista nutricionista) {
        return pacienteRepository
                .findVisiveisParaNutricionista(nutricionista.getId(), StatusRelacaoClinica.ATIVA)
                .stream()
                .map(this::paraResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PacienteResumoDTO buscarPaciente(String email, String cpf) {
        boolean emailInformado = email != null && !email.isBlank();
        boolean cpfInformado = cpf != null && !cpf.isBlank();

        if (emailInformado == cpfInformado) {
            throw new IllegalArgumentException("Informe exatamente um parâmetro: email ou cpf.");
        }

        Paciente paciente;
        if (emailInformado) {
            paciente = pacienteRepository.findByEmailIgnoreCase(email.trim())
                    .orElseThrow(PacienteNaoEncontradoException::new);
        } else {
            String cpfDigitos = normalizarCpf(cpf);
            if (cpfDigitos.isEmpty()) {
                throw new IllegalArgumentException("CPF inválido.");
            }
            paciente = pacienteRepository.findByCpfDigitos(cpfDigitos)
                    .orElseThrow(PacienteNaoEncontradoException::new);
        }

        return paraResumo(paciente);
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO buscarPorId(Nutricionista nutricionista, Integer id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(PacienteNaoEncontradoException::new);
        validarAcessoNutricionista(nutricionista, paciente);
        return paraResponse(paciente);
    }

    @Transactional
    public PacienteResponseDTO atualizar(Nutricionista nutricionista, Integer id, PacienteUpdateDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Dados de atualização são obrigatórios.");
        }

        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(PacienteNaoEncontradoException::new);
        validarAcessoNutricionista(nutricionista, paciente);

        if (dto.nome() == null || dto.nome().isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório.");
        }

        paciente.setNome(dto.nome().trim());
        paciente.setTelefone(dto.telefone());
        paciente.setSexo(dto.sexo());
        paciente.setDataNascimento(dto.dataNascimento());

        return paraResponse(pacienteRepository.save(paciente));
    }

    @Transactional
    public void vincular(Nutricionista nutricionista, Integer idPaciente) {
        Paciente paciente = pacienteRepository.findById(idPaciente)
                .orElseThrow(PacienteNaoEncontradoException::new);

        RelacaoClinica relacao = relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_Id(paciente.getId(), nutricionista.getId())
                .orElseGet(() -> relacaoClinicaRepository.save(
                        RelacaoClinica.criar(paciente, nutricionista)));

        if (relacao.getStatus() == StatusRelacaoClinica.ENCERRADA) {
            relacao.reativar();
            relacaoClinicaRepository.save(relacao);
        }
    }

    @Transactional
    public void desvincularNutricionista(Nutricionista nutricionista, Integer idPaciente) {
        RelacaoClinica relacao = relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_IdAndStatus(
                        idPaciente, nutricionista.getId(), StatusRelacaoClinica.ATIVA)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Não existe relação recorrente ativa com este paciente."));

        relacao.encerrar();
        relacaoClinicaRepository.save(relacao);
    }

    @Transactional
    public void desvincularPaciente(Paciente paciente, Integer idNutricionista) {
        RelacaoClinica relacao = relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_IdAndStatus(
                        paciente.getId(), idNutricionista, StatusRelacaoClinica.ATIVA)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Não existe relação recorrente ativa com este nutricionista."));

        relacao.encerrar();
        relacaoClinicaRepository.save(relacao);
    }

    private void validarAcessoNutricionista(Nutricionista nutricionista, Paciente paciente) {
        boolean relacaoAtiva = relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_IdAndStatus(
                        paciente.getId(), nutricionista.getId(), StatusRelacaoClinica.ATIVA)
                .isPresent();
        boolean consulta = consultaRepository.existsByPaciente_IdAndNutricionista_Id(
                paciente.getId(), nutricionista.getId());

        if (!relacaoAtiva && !consulta) {
            throw new AcessoNegadoException("Sem permissão para acessar dados deste paciente.");
        }
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

    private PacienteResumoDTO paraResumo(Paciente paciente) {
        return new PacienteResumoDTO(
                paciente.getId(),
                paciente.getNome(),
                paciente.getEmail(),
                paciente.getCpf());
    }

    private String normalizarCpf(String cpf) {
        return cpf.replaceAll("\\D", "");
    }
}
