package com.nutri4you.backend.dto;

import java.util.List;

public record AlimentosPaginadosResponseDTO(
        List<AlimentoResponseDTO> itens,
        int pagina,
        int tamanho,
        long totalItens,
        int totalPaginas) {
}

