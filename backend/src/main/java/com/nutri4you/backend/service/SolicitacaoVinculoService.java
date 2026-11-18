package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NutricionistaVinculoDTO;
import com.nutri4you.backend.dto.SolicitacaoVinculoDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SolicitacaoVinculoService {
    private final RelacaoClinicaRepository relacoes;
    private final PacienteRepository pacientes;
    private final NutricionistaRepository nutricionistas;

    public SolicitacaoVinculoService(RelacaoClinicaRepository relacoes, PacienteRepository pacientes,
                                    NutricionistaRepository nutricionistas) {
        this.relacoes = relacoes;
        this.pacientes = pacientes;
        this.nutricionistas = nutricionistas;
    }

    public record Profissional(Integer id, String nome) {}
    public record PedidoRecebido(Integer id, String pacienteNome, long versao) {}

    @Transactional(readOnly = true)
    public List<Profissional> pesquisar(String nome) {
        String termo = nome == null ? "" : nome.trim();
        if (termo.length() < 2 || termo.length() > 150) {
            throw new IllegalArgumentException("Informe entre 2 e 150 caracteres do nome.");
        }
        return nutricionistas.findByNomeContainingIgnoreCaseOrderByNomeAscIdAsc(termo, PageRequest.of(0, 20))
                .stream().map(n -> new Profissional(n.getId(), n.getNome())).toList();
    }

    @Transactional
    public void solicitar(Paciente paciente, Integer nutricionistaId) {
        Paciente titular = bloquearPaciente(paciente.getId());
        exigirSemVinculo(titular.getId());
        Nutricionista nutricionista = nutricionistas.findById(nutricionistaId)
                .orElseThrow(() -> new IllegalArgumentException("Nutricionista indisponível."));
        var existente = relacoes.findByPaciente_IdAndNutricionista_Id(titular.getId(), nutricionistaId);
        if (existente.isPresent() && existente.get().getStatus() == StatusRelacaoClinica.PENDENTE) {
            if (!existente.get().solicitadaPeloPaciente()) {
                throw new IllegalArgumentException("Este nutricionista já enviou um convite. Responda em Solicitações de vínculo.");
            }
            return;
        }
        RelacaoClinica relacao = existente.orElseGet(() -> RelacaoClinica.criarSolicitacao(titular, nutricionista));
        relacao.solicitar(true);
        relacoes.save(relacao);
    }

    @Transactional(readOnly = true)
    public List<PedidoRecebido> listarRecebidas(Nutricionista nutricionista) {
        return relacoes.findByNutricionista_IdAndStatusAndSolicitadaPeloPacienteTrue(
                nutricionista.getId(), StatusRelacaoClinica.PENDENTE).stream()
                .map(r -> new PedidoRecebido(r.getId(), r.getPaciente().getNome(), r.getVersao())).toList();
    }

    @Transactional
    public void decidirComoNutricionista(Nutricionista nutricionista, Integer id, Long versao, Boolean aceitar) {
        var relacao = relacoes.findByIdAndNutricionista_Id(id, nutricionista.getId())
                .filter(RelacaoClinica::solicitadaPeloPaciente)
                .orElseThrow(() -> new AcessoNegadoException("Solicitação indisponível para este nutricionista."));
        bloquearPaciente(relacao.getPaciente().getId());
        decidir(relacao, versao, aceitar);
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoVinculoDTO> listar(Paciente paciente) {
        return relacoes.findByPaciente_IdAndStatus(paciente.getId(), StatusRelacaoClinica.PENDENTE)
                .stream().filter(relacao -> !relacao.solicitadaPeloPaciente())
                .map(relacao -> new SolicitacaoVinculoDTO(
                        relacao.getId(), relacao.getNutricionista().getNome(), relacao.getVersao()))
                .toList();
    }

    @Transactional
    public NutricionistaVinculoDTO decidir(Paciente paciente, Integer id, Long versao, Boolean aceitar) {
        bloquearPaciente(paciente.getId());
        RelacaoClinica relacao = relacoes.findByIdAndPaciente_Id(id, paciente.getId())
                .filter(r -> !r.solicitadaPeloPaciente())
                .orElseThrow(() -> new AcessoNegadoException("Solicitação indisponível para este paciente."));
        decidir(relacao, versao, aceitar);
        if (!aceitar) return null;
        var profissional = relacao.getNutricionista();
        return new NutricionistaVinculoDTO(profissional.getId(), profissional.getNome(), profissional.getEmail());
    }

    private void decidir(RelacaoClinica relacao, Long versao, Boolean aceitar) {
        if (versao == null || aceitar == null) {
            throw new IllegalArgumentException("Informe a versão e a decisão sobre o vínculo.");
        }
        if (relacao.getStatus() != StatusRelacaoClinica.PENDENTE || relacao.getVersao() != versao) {
            throw new ObjectOptimisticLockingFailureException(RelacaoClinica.class, relacao.getId());
        }

        if (!aceitar) {
            relacao.recusar();
            relacoes.flush();
        } else {
            exigirSemVinculo(relacao.getPaciente().getId());
            relacao.reativar();
        }
        relacoes.flush();
    }

    private Paciente bloquearPaciente(Integer id) {
        return pacientes.findByIdForUpdate(id).orElseThrow(() -> new AcessoNegadoException("Paciente indisponível."));
    }

    private void exigirSemVinculo(Integer pacienteId) {
        if (relacoes.existsByPaciente_IdAndStatus(pacienteId, StatusRelacaoClinica.ATIVA)) {
            throw new IllegalArgumentException("É permitido apenas um vínculo ativo. Encerre o vínculo atual para continuar.");
        }
    }
}
