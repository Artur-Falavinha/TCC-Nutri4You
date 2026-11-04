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
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
        LocalDate dia = data == null ? LocalDate.now(clock) : data;
        if (dia.isAfter(LocalDate.now(clock))) throw new IllegalArgumentException("Não é possível consultar consumo futuro.");
        Set<Integer> marcadas = consumos.findByPaciente_IdAndData(paciente.getId(), dia).stream()
                .filter(ConsumoRefeicao::isConsumida).map(c -> c.getRefeicao().getId()).collect(Collectors.toSet());
        List<RefeicaoConsumo> refeicoes = planos.sobrepostos(paciente.getId(), dia, dia).stream()
                .flatMap(p -> p.getRefeicoes().stream()).filter(r -> r.previstaEm(dia))
                .sorted(java.util.Comparator.comparing(Refeicao::getHorario).thenComparing(Refeicao::getId))
                .map(r -> new RefeicaoConsumo(r.getId(), r.getNome(), r.getHorario(), marcadas.contains(r.getId()), nutrientes(r))).toList();
        Nutrientes totais = refeicoes.stream().filter(RefeicaoConsumo::consumida).map(RefeicaoConsumo::totais)
                .reduce(Nutrientes.zero(), Nutrientes::somar).arredondar();
        return new Diario(dia, dia.equals(LocalDate.now(clock)), refeicoes, totais);
    }
    @Transactional
    public Diario marcar(Paciente paciente, Integer refeicaoId, Marcacao request) {
        if (request == null || request.data() == null || request.consumida() == null
                || !request.data().equals(LocalDate.now(clock)))
            throw new IllegalArgumentException("Marque ou desmarque somente refeições de hoje.");
        Paciente titular = em.find(Paciente.class, paciente.getId(), LockModeType.PESSIMISTIC_WRITE);
        Refeicao refeicao = planos.sobrepostos(titular.getId(), request.data(), request.data()).stream()
                .flatMap(p -> p.getRefeicoes().stream()).filter(r -> r.getId().equals(refeicaoId) && r.previstaEm(request.data()))
                .findFirst().orElseThrow(PlanoNaoEncontradoException::new);
        ConsumoRefeicao consumo = consumos.findByPaciente_IdAndData(titular.getId(), request.data()).stream()
                .filter(c -> c.getRefeicao().getId().equals(refeicaoId)).findFirst()
                .orElseGet(() -> new ConsumoRefeicao(titular, refeicao, request.data()));
        consumo.marcar(request.consumida());
        consumos.saveAndFlush(consumo);
        return consultar(titular, request.data());
    }
    private Nutrientes nutrientes(Refeicao refeicao) {
        return refeicao.getItens().stream().map(ItemRefeicao::nutrientes).reduce(Nutrientes.zero(), Nutrientes::somar).arredondar();
    }
}
