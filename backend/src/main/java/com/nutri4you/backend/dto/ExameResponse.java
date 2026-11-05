package com.nutri4you.backend.dto;

import com.nutri4you.backend.model.Exame;
import java.time.Instant;
import java.time.LocalDate;

public record ExameResponse(Integer id, Integer pacienteId, Integer nutricionistaId, String nome, String descricao,
        LocalDate dataSolicitacao, LocalDate dataEnvio, String status, String arquivoNome, String arquivoTipo,
        Long arquivoTamanho, String parecer, Instant analisadoEm, long versao) {
    public static ExameResponse from(Exame e) {
        return new ExameResponse(e.getId(), e.getPaciente().getId(), e.getNutricionista().getId(), e.getNome(), e.getDescricao(),
                e.getDataSolicitacao(), e.getDataEnvio(), e.getStatus(), e.getArquivoNome(), e.getArquivoTipo(),
                e.getArquivoTamanho(), e.getParecer(), e.getAnalisadoEm(), e.getVersao());
    }
}
