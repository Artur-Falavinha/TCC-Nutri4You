package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.*;
import com.nutri4you.backend.exception.PlanoNaoEncontradoException;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ConsumoRefeicaoService {
    private final PlanoAlimentarRepository planos;
    private final ConsumoRefeicaoRepository consumos;
    private final EntityManager em;
    private final Clock clock;
    public ConsumoRefeicaoService(PlanoAlimentarRepository planos, ConsumoRefeicaoRepository consumos, EntityManager em, Clock clock) {
        this.planos = planos; this.consumos = consumos; this.em = em; this.clock = clock;
    }
    public record RefeicaoConsumo(Integer id, String nome, LocalTime horario, boolean consumida, Nutrientes totais) {}
    public record Diario(LocalDate data, boolean editavel, List<RefeicaoConsumo> refeicoes, Nutrientes totais) {}
    public record Marcacao(LocalDate data, Boolean consumida) {}

    public Diario consultar(Paciente paciente, LocalDate data) {
        LocalDate hoje = LocalDate.now(clock);
        LocalDate dia = data == null ? hoje : data;
        if (dia.isAfter(hoje)) throw new IllegalArgumentException("Não é possível consultar consumo futuro.");
        Map<Integer, Refeicao> refeicoesPorId = new HashMap<>();
        planos.sobrepostos(paciente.getId(), dia, dia).stream()
                .flatMap(plano -> plano.getRefeicoes().stream())
                .filter(refeicao -> refeicao.previstaEm(dia))
                .forEach(refeicao -> refeicoesPorId.put(refeicao.getId(), refeicao));
        Set<Integer> refeicoesConsumidas = new HashSet<>();
        for (ConsumoRefeicao consumo : consumos.findByPaciente_IdAndData(paciente.getId(), dia)) {
            Refeicao refeicao = consumo.getRefeicao();
            refeicoesPorId.put(refeicao.getId(), refeicao);
            if (consumo.isConsumida()) refeicoesConsumidas.add(refeicao.getId());
        }
        List<RefeicaoConsumo> refeicoes = refeicoesPorId.values().stream()
                .sorted(Comparator.comparing(Refeicao::getHorario).thenComparing(Refeicao::getId))
                .map(refeicao -> resumo(refeicao, refeicoesConsumidas.contains(refeicao.getId())))
                .toList();
        Nutrientes totais = refeicoes.stream().filter(RefeicaoConsumo::consumida).map(RefeicaoConsumo::totais)
                .reduce(Nutrientes.zero(), Nutrientes::somar).arredondar();
        return new Diario(dia, dia.equals(hoje), refeicoes, totais);
    }
    @Transactional
    public Diario marcar(Paciente paciente, Integer refeicaoId, Marcacao request) {
        if (request == null || request.data() == null || request.consumida() == null)
            throw new IllegalArgumentException("Informe o dia e a marcação da refeição.");
        Paciente titular = em.find(Paciente.class, paciente.getId(), LockModeType.PESSIMISTIC_WRITE);
        if (!request.data().equals(LocalDate.now(clock)))
            throw new IllegalArgumentException("O dia mudou. Recarregue as refeições de hoje.");
        ConsumoRefeicao consumo = consumos.findByPaciente_IdAndData(titular.getId(), request.data()).stream()
                .filter(c -> c.getRefeicao().getId().equals(refeicaoId)).findFirst()
                .orElseGet(() -> {
                    Refeicao refeicao = planos.sobrepostos(titular.getId(), request.data(), request.data()).stream()
                            .flatMap(plano -> plano.getRefeicoes().stream())
                            .filter(r -> r.getId().equals(refeicaoId) && r.previstaEm(request.data()))
                            .findFirst().orElseThrow(PlanoNaoEncontradoException::new);
                    return new ConsumoRefeicao(titular, refeicao, request.data());
                });
        consumo.marcar(request.consumida());
        consumos.saveAndFlush(consumo);
        return consultar(titular, request.data());
    }
    private RefeicaoConsumo resumo(Refeicao refeicao, boolean consumida) {
        return new RefeicaoConsumo(refeicao.getId(), refeicao.getNome(), refeicao.getHorario(),
                consumida, nutrientes(refeicao));
    }

    private Nutrientes nutrientes(Refeicao refeicao) {
        return refeicao.getItens().stream().map(ItemRefeicao::nutrientes).reduce(Nutrientes.zero(), Nutrientes::somar).arredondar();
    }
}
