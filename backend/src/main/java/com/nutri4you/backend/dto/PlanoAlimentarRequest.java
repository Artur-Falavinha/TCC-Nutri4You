package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PlanoAlimentarRequest(
        Integer pacienteId,
        Integer consultaId,
        String titulo,
        String observacoes,
        String status,
        LocalDate vigenciaInicio,
        LocalDate vigenciaFim,
        BigDecimal metaCalorias,
        BigDecimal metaCarboidratos,
        BigDecimal metaGordura,
        BigDecimal metaProteina,
        Long versao,
        List<RefeicaoPrescricaoRequest> refeicoes) {

    public record RefeicaoPrescricaoRequest(
            Integer id,
            String nome,
            String horario,
            String diaSemana,
            String descricao,
            Integer ordem,
            List<ItemPrescricaoRequest> itens) {
    }

    public record ItemPrescricaoRequest(
            Integer id,
            Integer alimentoId,
            Integer idAlimento,
            String nomeAlimento,
            BigDecimal quantidadeGramas,
            Integer ordem,
            List<SubstitutoPrescricaoRequest> substitutos) {

        public Integer alimentoIdEfetivo() {
            return alimentoId != null ? alimentoId : idAlimento;
        }
    }

    public record SubstitutoPrescricaoRequest(
            Integer id,
            Integer alimentoId,
            Integer idAlimento,
            String nomeAlimento,
            BigDecimal quantidadeGramas,
            Integer ordem) {

        public Integer alimentoIdEfetivo() {
            return alimentoId != null ? alimentoId : idAlimento;
        }
    }
}

