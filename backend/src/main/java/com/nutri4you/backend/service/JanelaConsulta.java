package com.nutri4you.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.Clock;
import java.time.LocalDateTime;

@Component
public class JanelaConsulta {
    private final Clock clock;
    private final int antes;
    private final int depois;
    public JanelaConsulta(Clock clock, @Value("${app.consulta.inicio-minutos-antes:15}") int antes,
                          @Value("${app.consulta.inicio-minutos-depois:15}") int depois) {
        if (antes < 0 || depois < 0 || antes > 1440 || depois > 1440) {
            throw new IllegalArgumentException("Janela de consulta inválida.");
        }
        this.clock = clock;
        this.antes = antes;
        this.depois = depois;
    }
    public LocalDateTime agora() { return LocalDateTime.now(clock); }
    public LocalDateTime inicio(LocalDateTime horario) { return horario.minusMinutes(antes); }
    public LocalDateTime fim(LocalDateTime horario) { return horario.plusMinutes(depois); }
    public boolean permite(LocalDateTime horario) {
        var agora = agora();
        return !agora.isBefore(inicio(horario)) && !agora.isAfter(fim(horario));
    }
}
