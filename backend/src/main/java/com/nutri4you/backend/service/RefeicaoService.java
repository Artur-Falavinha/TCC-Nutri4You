package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;

@Service
public class RefeicaoService {
    private final PlanoAlimentarRepository planos;
    private final AlimentoRepository alimentos;
    private final GestaoPacienteService gestao;
    public RefeicaoService(PlanoAlimentarRepository planos, AlimentoRepository alimentos, GestaoPacienteService gestao) {
        this.planos = planos; this.alimentos = alimentos; this.gestao = gestao;
    }

    @Transactional
    public PlanoAlimentarResponse salvar(Nutricionista n, Integer pacienteId, Integer planoId, Integer refeicaoId, RefeicaoRequest r) {
        if (r == null) throw new IllegalArgumentException("Informe a refeição.");
        PlanoAlimentar p = exigir(n, pacienteId, planoId, r.versaoPlano());
        if (r.nome() == null || r.nome().isBlank() || r.nome().trim().length() > 100
                || r.horario() == null || r.horario().getSecond() != 0 || r.horario().getNano() != 0) {
            throw new IllegalArgumentException("Informe nome de até 100 caracteres e horário em minutos.");
        }
        validarDia(r.diaSemana());
        if (r.itens() == null || r.itens().isEmpty() || r.itens().size() > 50) {
            throw new IllegalArgumentException("Inclua de 1 a 50 alimentos por refeição.");
        }
        var ids = new HashSet<Integer>();
        var itens = new ArrayList<ItemRefeicao>();
        for (var item : r.itens()) {
            if (item == null || item.alimentoId() == null || !ids.add(item.alimentoId()) || item.quantidadeGramas() == null
                    || item.quantidadeGramas().signum() <= 0 || item.quantidadeGramas().compareTo(new BigDecimal("9999.99")) > 0
                    || item.quantidadeGramas().stripTrailingZeros().scale() > 2) {
                throw new IllegalArgumentException("Alimentos devem ser únicos e ter quantidade entre 0,01 e 9999,99 gramas.");
            }
            var alimento = alimentos.findById(item.alimentoId()).orElseThrow(() -> new IllegalArgumentException("Alimento não encontrado."));
            itens.add(new ItemRefeicao(alimento, item.quantidadeGramas()));
        }
        Refeicao refeicao = refeicaoId == null ? new Refeicao(p) : encontrar(p, refeicaoId);
        if (refeicaoId == null) {
            if (p.getRefeicoes().size() >= 140) throw new IllegalArgumentException("Limite de 140 refeições por plano.");
            p.getRefeicoes().add(refeicao);
        }
        refeicao.editar(r.nome().trim(), r.horario(), r.diaSemana(), itens);
        return concluir(p);
    }

    @Transactional
    public PlanoAlimentarResponse excluir(Nutricionista n, Integer pacienteId, Integer planoId, Integer refeicaoId, Long versao) {
        PlanoAlimentar p = exigir(n, pacienteId, planoId, versao);
        p.getRefeicoes().remove(encontrar(p, refeicaoId));
        return concluir(p);
    }

    @Transactional
    public PlanoAlimentarResponse replicar(Nutricionista n, Integer pacienteId, Integer planoId, Integer refeicaoId,
                                           List<Integer> dias, Long versao) {
        PlanoAlimentar p = exigir(n, pacienteId, planoId, versao);
        Refeicao origem = encontrar(p, refeicaoId);
        if (dias == null || dias.isEmpty() || dias.size() > 6 || new HashSet<>(dias).size() != dias.size()
                || dias.contains(origem.getDiaSemana()) || p.getRefeicoes().size() + dias.size() > 140) {
            throw new IllegalArgumentException("Escolha de 1 a 6 dias diferentes do dia de origem, sem repetições.");
        }
        for (Integer dia : dias) {
            validarDia(dia);
            var copia = new Refeicao(p);
            copia.editar(origem.getNome(), origem.getHorario(), dia, origem.getItens().stream()
                    .map(i -> new ItemRefeicao(i.getAlimento(), i.getQuantidadeGramas())).toList());
            p.getRefeicoes().add(copia);
        }
        return concluir(p);
    }
    private PlanoAlimentar exigir(Nutricionista n, Integer pacienteId, Integer planoId, Long versao) {
        gestao.exigirAcesso(n, pacienteId);
        PlanoAlimentar p = planos.findByIdAndPaciente_IdAndNutricionista_Id(planoId, pacienteId, n.getId())
                .orElseThrow(PlanoNaoEncontradoException::new);
        if (versao == null) throw new IllegalArgumentException("Informe a versão do plano.");
        if (!"RASCUNHO".equals(p.getStatus()) || versao != p.getVersao()) {
            throw new PlanoConflitoException("Somente o rascunho na versão atual pode ser alterado.");
        }
        return p;
    }
    private Refeicao encontrar(PlanoAlimentar p, Integer id) {
        return p.getRefeicoes().stream().filter(r -> r.getId().equals(id)).findFirst()
                .orElseThrow(() -> new PlanoNaoEncontradoException());
    }
    private void validarDia(Integer dia) {
        if (dia == null || dia < 1 || dia > 7) throw new IllegalArgumentException("Dia da semana deve estar entre 1 e 7.");
    }
    private PlanoAlimentarResponse concluir(PlanoAlimentar p) {
        p.tocar(); // Forces optimistic locking even for edits only to child collections.
        planos.saveAndFlush(p);
        return PlanoAlimentarResponse.from(p);
    }
}
