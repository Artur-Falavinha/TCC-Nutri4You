package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.NutricionistaVinculoDTO;
import com.nutri4you.backend.dto.SolicitacaoVinculoDTO;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.model.StatusRelacaoClinica;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SolicitacaoVinculoService {
    private final RelacaoClinicaRepository relacoes;

    public SolicitacaoVinculoService(RelacaoClinicaRepository relacoes) {
        this.relacoes = relacoes;
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoVinculoDTO> listar(Paciente paciente) {
        return relacoes.findByPaciente_IdAndStatus(paciente.getId(), StatusRelacaoClinica.PENDENTE)
                .stream()
                .map(relacao -> new SolicitacaoVinculoDTO(
                        relacao.getId(), relacao.getNutricionista().getNome(), relacao.getVersao()))
                .toList();
    }

    @Transactional
    public NutricionistaVinculoDTO decidir(Paciente paciente, Integer id, Long versao, Boolean aceitar) {
        if (versao == null || aceitar == null) {
            throw new IllegalArgumentException("Informe a versão e a decisão sobre o vínculo.");
        }
        RelacaoClinica relacao = relacoes.findByIdAndPaciente_Id(id, paciente.getId())
                .orElseThrow(() -> new AcessoNegadoException("Solicitação indisponível para este paciente."));
        if (relacao.getStatus() != StatusRelacaoClinica.PENDENTE || relacao.getVersao() != versao) {
            throw new ObjectOptimisticLockingFailureException(RelacaoClinica.class, id);
        }

        if (!aceitar) {
            relacao.recusar();
            relacoes.flush();
            return null;
        }

        relacao.reativar();
        relacoes.flush();
        var profissional = relacao.getNutricionista();
        return new NutricionistaVinculoDTO(profissional.getId(), profissional.getNome(), profissional.getEmail());
    }
}
