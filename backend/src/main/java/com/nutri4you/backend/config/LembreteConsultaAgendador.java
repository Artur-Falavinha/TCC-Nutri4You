package com.nutri4you.backend.config;

import com.nutri4you.backend.service.LembreteConsultaService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@ConditionalOnProperty(name = "app.lembrete-consulta.agendador-ativo", havingValue = "true", matchIfMissing = true)
public class LembreteConsultaAgendador {
    private final LembreteConsultaService lembretes;

    public LembreteConsultaAgendador(LembreteConsultaService lembretes) {
        this.lembretes = lembretes;
    }

    @Scheduled(fixedDelayString = "${app.lembrete-consulta.intervalo:PT1M}")
    public void processar() {
        lembretes.processarPendentes();
    }
}
