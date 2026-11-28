package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PacienteResumoDTO;
import com.nutri4you.backend.dto.PacienteResponseDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.exception.VinculoEncerradoException;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.NotificacaoConsultaPaciente;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class GestaoPacienteService {

    private final PacienteRepository pacienteRepository;
    private final RelacaoClinicaRepository relacaoClinicaRepository;
    private final ConsultaRepository consultaRepository;
    private final NutricionistaRepository nutricionistaRepository;
    private final Clock clock;
    private final NotificacaoAgendaEmailService notificacoesEmail;
    private final NotificacaoConsultaPacienteService notificacoesPaciente;

    public GestaoPacienteService(
            PacienteRepository pacienteRepository,
            RelacaoClinicaRepository relacaoClinicaRepository,
            ConsultaRepository consultaRepository,
            NutricionistaRepository nutricionistaRepository,
            Clock clock,
            NotificacaoAgendaEmailService notificacoesEmail,
            NotificacaoConsultaPacienteService notificacoesPaciente) {
        this.pacienteRepository = pacienteRepository;
        this.relacaoClinicaRepository = relacaoClinicaRepository;
        this.consultaRepository = consultaRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.clock = clock;
        this.notificacoesEmail = notificacoesEmail;
        this.notificacoesPaciente = notificacoesPaciente;
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
    public PacienteResumoDTO buscarPaciente(Nutricionista nutricionista, String email, String cpf) {
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
            String cpfDigitos = Paciente.normalizarCpf(cpf);
            if (cpfDigitos == null) {
                throw new IllegalArgumentException("CPF inválido.");
            }
            paciente = pacienteRepository.findByCpfAndCpfOriginalConflitanteIsNull(cpfDigitos)
                    .orElseThrow(PacienteNaoEncontradoException::new);
        }

        if (relacaoClinicaRepository.existsByPaciente_IdAndNutricionista_IdAndEncerradaEmIsNotNull(
                paciente.getId(), nutricionista.getId())) {
            throw new PacienteNaoEncontradoException();
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
        if (relacao.getStatus() == StatusRelacaoClinica.PENDENTE && relacao.solicitadaPeloPaciente()) {
            throw new IllegalArgumentException("Responda à solicitação do paciente em Notificações.");
        }
        return relacao.getStatus();
    }

    @Transactional
    public void desvincularNutricionista(Nutricionista nutricionista, Integer idPaciente) {
        encerrarVinculo(idPaciente, nutricionista.getId(),
                "Não existe relação recorrente ativa com este paciente.");
    }

    @Transactional
    public void desvincularPaciente(Paciente paciente, Integer idNutricionista) {
        encerrarVinculo(paciente.getId(), idNutricionista,
                "Não existe relação recorrente ativa com este nutricionista.");
    }

    void ativarVinculoAoAceitarAgendamento(Consulta consulta) {
        if (!consulta.isAvulsa()) {
            return;
        }
        Integer pacienteId = consulta.getPaciente().getId();
        Integer nutricionistaId = consulta.getNutricionista().getId();
        nutricionistaRepository.findByIdForUpdate(nutricionistaId)
                .orElseThrow(() -> new IllegalArgumentException("Nutricionista indisponível."));
        pacienteRepository.findByIdForUpdate(pacienteId)
                .orElseThrow(PacienteNaoEncontradoException::new);

        relacaoClinicaRepository.findByPaciente_IdAndStatus(pacienteId, StatusRelacaoClinica.ATIVA)
                .stream()
                .filter(relacao -> !relacao.getNutricionista().getId().equals(nutricionistaId))
                .findFirst()
                .ifPresent(relacao -> {
                    throw new IllegalArgumentException("O paciente já possui outro nutricionista vinculado.");
                });

        RelacaoClinica relacao = relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_Id(pacienteId, nutricionistaId)
                .orElseGet(() -> RelacaoClinica.criarSolicitacao(
                        consulta.getPaciente(), consulta.getNutricionista()));
        if (relacao.getStatus() != StatusRelacaoClinica.ATIVA) {
            relacao.reativar();
            relacaoClinicaRepository.save(relacao);
        }
    }

    private void encerrarVinculo(Integer pacienteId, Integer nutricionistaId, String mensagemSemVinculo) {
        Nutricionista nutricionista = nutricionistaRepository.findByIdForUpdate(nutricionistaId)
                .orElseThrow(() -> new IllegalArgumentException(mensagemSemVinculo));
        pacienteRepository.findByIdForUpdate(pacienteId).orElseThrow(PacienteNaoEncontradoException::new);
        RelacaoClinica relacao = relacaoClinicaRepository
                .findByPaciente_IdAndNutricionista_IdAndStatus(pacienteId, nutricionistaId, StatusRelacaoClinica.ATIVA)
                .orElseThrow(() -> new IllegalArgumentException(mensagemSemVinculo));

        LocalDateTime agora = LocalDateTime.now(clock);
        List<Consulta> canceladas = consultaRepository.bloquearConsultasEmAberto(pacienteId, nutricionistaId, agora);
        canceladas.forEach(Consulta::cancelar);
        relacao.encerrar();
        consultaRepository.flush();
        canceladas.stream()
                .filter(consulta -> !consulta.getDataHora().isBefore(agora) || consulta.getIniciadaEm() != null)
                .forEach(consulta -> notificacoesPaciente.registrar(consulta, NotificacaoConsultaPaciente.Tipo.CANCELADA));
        notificacoesEmail.agendarCancelamentosPorVinculo(nutricionista, canceladas.size());
    }

    private void validarAcessoNutricionista(Nutricionista nutricionista, Paciente paciente) {
        if (!relacaoAtiva(nutricionista, paciente)) {
            if (relacaoClinicaRepository.existsByPaciente_IdAndNutricionista_IdAndEncerradaEmIsNotNull(
                    paciente.getId(), nutricionista.getId())) {
                throw new VinculoEncerradoException();
            }
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

}
