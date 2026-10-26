package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class PrescricaoDTO {
    private PrescricaoDTO() {}

    public record Nutrientes(
            BigDecimal kcal, BigDecimal proteinas, BigDecimal carboidratos, BigDecimal gorduras,
            BigDecimal fibras) {
        public Nutrientes(BigDecimal kcal, BigDecimal proteinas, BigDecimal carboidratos, BigDecimal gorduras) {
            this(kcal, proteinas, carboidratos, gorduras, null);
        }

        public static Nutrientes zero() {
            return new Nutrientes(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        public Nutrientes somar(Nutrientes outro) {
            return new Nutrientes(somar(kcal, outro.kcal), somar(proteinas, outro.proteinas),
                    somar(carboidratos, outro.carboidratos), somar(gorduras, outro.gorduras),
                    somar(fibras, outro.fibras));
        }

        private static BigDecimal somar(BigDecimal valor, BigDecimal outro) {
            return valor == null || outro == null ? null : valor.add(outro);
        }

        public Nutrientes proporcional(BigDecimal gramas) {
            BigDecimal proporcao = gramas.movePointLeft(2);
            return new Nutrientes(proporcional(kcal, proporcao), proporcional(proteinas, proporcao),
                    proporcional(carboidratos, proporcao), proporcional(gorduras, proporcao),
                    proporcional(fibras, proporcao));
        }

        private static BigDecimal proporcional(BigDecimal valor, BigDecimal proporcao) {
            return valor == null ? null : valor.multiply(proporcao);
        }

        public Nutrientes arredondar() {
            return new Nutrientes(arredondar(kcal), arredondar(proteinas), arredondar(carboidratos),
                    arredondar(gorduras), arredondar(fibras));
        }

        private static BigDecimal arredondar(BigDecimal valor) {
            return valor == null ? null : valor.setScale(2, RoundingMode.HALF_UP);
        }
    }

    public record AlimentoDTO(
            Integer id,
            Integer codigoTaco,
            String nome,
            String categoria,
            BigDecimal kcal100g,
            BigDecimal proteina100g,
            BigDecimal carboidratos100g,
            BigDecimal gordura100g,
            BigDecimal fibra100g,
            String fonte,
            String versaoFonte,
            String observacaoFonte,
            boolean disponivelParaPrescricao) {}

    public record PaginaAlimentos(
            List<AlimentoDTO> alimentos,
            int pagina,
            int tamanho,
            long totalElementos,
            int totalPaginas) {}

    public record SubstitutoRequest(Integer alimentoId, BigDecimal quantidadeGramas) {}

    public record ItemRequest(Integer alimentoId, BigDecimal quantidadeGramas, List<SubstitutoRequest> substitutos) {
        public ItemRequest {
            substitutos = substitutos == null ? List.of() : substitutos;
        }

        public ItemRequest(Integer alimentoId, BigDecimal quantidadeGramas) {
            this(alimentoId, quantidadeGramas, List.of());
        }
    }

    public record RefeicaoRequest(String nome, LocalTime horario, List<ItemRequest> itens) {}

    public record PlanoRequest(
            String titulo,
            String orientacoes,
            LocalDate vigenciaInicio,
            LocalDate vigenciaFim,
            Nutrientes metas,
            Long versao,
            List<RefeicaoRequest> refeicoes) {}

    public record PublicacaoRequest(Long versao) {}

    public record CompraRequest(Integer planoId, Integer dias, Boolean comprado) {}

    public record SubstitutoDTO(AlimentoDTO alimento, BigDecimal quantidadeGramas, Nutrientes nutrientes) {}

    public record ItemRefeicaoDTO(
            AlimentoDTO alimento, BigDecimal quantidadeGramas, Nutrientes nutrientes,
            List<SubstitutoDTO> substitutos) {}

    public record RefeicaoDTO(
            Integer id,
            String nome,
            LocalTime horario,
            List<ItemRefeicaoDTO> itens,
            Nutrientes totais) {}

    public record PlanoDTO(
            Integer id,
            Integer pacienteId,
            Integer nutricionistaId,
            String nutricionistaNome,
            String titulo,
            String orientacoes,
            String status,
            Long versao,
            LocalDate vigenciaInicio,
            LocalDate vigenciaFim,
            Instant publicadoEm,
            Nutrientes metas,
            Nutrientes totais,
            List<RefeicaoDTO> refeicoes) {}

    public record ItemCompraDTO(
            Integer alimentoId,
            String nome,
            String categoria,
            BigDecimal quantidadeGramas,
            boolean comprado) {}

    public record ListaComprasDTO(
            Integer planoId,
            String planoTitulo,
            int dias,
            int totalItens,
            int itensComprados,
            int itensPendentes,
            List<ItemCompraDTO> itens) {}
}
