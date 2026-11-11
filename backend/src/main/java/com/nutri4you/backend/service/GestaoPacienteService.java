package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PacienteResumoDTO;
import com.nutri4you.backend.dto.PacienteResponseDTO;
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
                .map(paciente -> paraResponse(paciente, nutricionista))
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
        return paraResponse(paciente, nutricionista);
    }

    @Transactional(readOnly = true)
    public Paciente exigirAcesso(Nutricionista nutricionista, Integer id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(PacienteNaoEncontradoException::new);
        validarAcessoNutricionista(nutricionista, paciente);
        return paciente;
    }

    @Transactional
    public StatusRelacaoClinica vincular(Nutricionista nutricionista, Integer idPaciente) {
        Paciente paciente = pacienteRepository.findByIdForUpdate(idPaciente)
                .orElseThrow(PacienteNaoEncontradoException::new);

        RelacaoClinica relacao = relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_Id(paciente.getId(), nutricionista.getId())
                .orElseGet(() -> relacaoClinicaRepository.save(
                        RelacaoClinica.criarSolicitacao(paciente, nutricionista)));

        if (relacao.getStatus() == StatusRelacaoClinica.ENCERRADA) {
            relacao.solicitar();
        }
        return relacao.getStatus();
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

    @Transactional(readOnly = true)
    public void exigirAcessoAoHistoricoDeConsultas(Nutricionista nutricionista, Integer pacienteId) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(PacienteNaoEncontradoException::new);
        if (!relacaoAtiva(nutricionista, paciente)
                && !consultaRepository.existsByPaciente_IdAndNutricionista_IdAndAvulsaFalse(
                        pacienteId, nutricionista.getId())) {
            throw new AcessoNegadoException("Sem permissão para acessar consultas deste paciente.");
        }
    }

    private void validarAcessoNutricionista(Nutricionista nutricionista, Paciente paciente) {
        if (!relacaoAtiva(nutricionista, paciente)) {
            throw new AcessoNegadoException("Sem permissão para acessar dados deste paciente.");
        }
    }

    private PacienteResponseDTO paraResponse(Paciente paciente, Nutricionista nutricionista) {
        return new PacienteResponseDTO(
                paciente.getId(),
                paciente.getNome(),
                paciente.getCpf(),
                paciente.getEmail(),
                paciente.getTelefone(),
                paciente.getSexo(),
                paciente.getDataNascimento(),
                relacaoAtiva(nutricionista, paciente));
    }

    private boolean relacaoAtiva(Nutricionista nutricionista, Paciente paciente) {
        return relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_IdAndStatus(
                        paciente.getId(), nutricionista.getId(), StatusRelacaoClinica.ATIVA)
                .isPresent();
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
