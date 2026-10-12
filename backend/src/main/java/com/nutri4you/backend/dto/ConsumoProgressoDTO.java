package com.nutri4you.backend.dto;

public record ConsumoProgressoDTO(
        String data,
        Double caloriasConsumidas,
        Double metaCalorias,
        Double proteinas,
        Double metaProteinas,
        Double carboidratos,
        Double metaCarboidratos,
        Double gorduras,
        Double metaGorduras
) {}

