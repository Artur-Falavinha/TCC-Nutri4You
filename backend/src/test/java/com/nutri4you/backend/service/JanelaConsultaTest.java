package com.nutri4you.backend.service;

import org.junit.jupiter.api.Test;
import java.time.*;
import static org.assertj.core.api.Assertions.*;

class JanelaConsultaTest {
    private final LocalDateTime horario = LocalDateTime.of(2030, 1, 7, 12, 0);
    private JanelaConsulta janela(LocalDateTime agora, int antes, int depois) {
        ZoneId zona = ZoneId.of("America/Sao_Paulo");
        return new JanelaConsulta(Clock.fixed(agora.atZone(zona).toInstant(), zona), antes, depois);
    }
    @Test void limitesSaoInclusivosENaoDependemDoFusoDoServidor() {
        assertThat(janela(horario.minusMinutes(15), 15, 15).permite(horario)).isTrue();
        assertThat(janela(horario.plusMinutes(15), 15, 15).permite(horario)).isTrue();
        assertThat(janela(horario.minusMinutes(15).minusNanos(1), 15, 15).permite(horario)).isFalse();
        assertThat(janela(horario.plusMinutes(15).plusNanos(1), 15, 15).permite(horario)).isFalse();
    }
    @Test void permiteConfigurarSomenteAntesOuSomenteDepois() {
        assertThat(janela(horario.plusSeconds(1), 15, 0).permite(horario)).isFalse();
        assertThat(janela(horario.minusSeconds(1), 0, 15).permite(horario)).isFalse();
        assertThatThrownBy(() -> janela(horario, -1, 15)).isInstanceOf(IllegalArgumentException.class);
    }
}
