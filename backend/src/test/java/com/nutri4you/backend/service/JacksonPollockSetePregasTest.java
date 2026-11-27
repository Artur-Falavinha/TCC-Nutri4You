package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.model.Paciente;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class JacksonPollockSetePregasTest {
    @Test
    void calculaGorduraParaHomemAdulto() {
        var paciente = new Paciente("Paciente", "00000000000", LocalDate.of(1996, 1, 1),
                "Masculino", null, "paciente@teste.com", "hash");
        BigDecimal prega = new BigDecimal("20");
        var request = new AvaliacaoRequest(new BigDecimal("80"), new BigDecimal("1.80"), null,
                null, null, null, null, prega, prega, prega, prega, prega, prega, prega,
                null, null, null, null);

        var percentual = JacksonPollockSetePregas.calcularPercentual(paciente, LocalDate.of(2026, 1, 1), request);

        assertThat(percentual).isEqualByComparingTo("19.98");
    }
}
