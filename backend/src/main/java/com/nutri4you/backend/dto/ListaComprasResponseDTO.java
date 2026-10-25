package com.nutri4you.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ListaComprasResponseDTO(
        Integer id,
        Integer planoId,
        LocalDate dataGeracao,
        List<ItemListaComprasDTO> itens) {

    public record ItemListaComprasDTO(
            Integer id,
            Integer alimentoId,
            String nomeItem,
            String categoria,
            String quantidade,
            BigDecimal quantidadeGramas,
            Boolean comprado) {
    }
}

