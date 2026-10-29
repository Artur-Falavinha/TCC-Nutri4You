package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.ConsultaConflitoException;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import static org.assertj.core.api.Assertions.*;

class ConsultaServiceTest extends ClinicalServiceTestSupport {
    @Autowired ConsultaService service;
    @Test void confirmarExigeSolicitacaoFuturaEVersaoAtual() {
        var consulta = consulta(agora().plusDays(1), "AGUARDANDO_CONFIRMACAO");
        assertThatThrownBy(() -> service.confirmar(nutri, paciente.getId(), consulta.getId(), 99L)).isInstanceOf(ConsultaConflitoException.class);
        assertThat(service.confirmar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao()).status()).isEqualTo("CONFIRMADA");
        assertThatThrownBy(() -> service.confirmar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao())).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void iniciarMarcaAtendimentoEImpedeReinicioECancelamento() {
        var consulta = consulta(agora().plusMinutes(5), "CONFIRMADA");
        var resposta = service.iniciar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao());
        assertThat(resposta.iniciadaEm()).isNotNull();
        assertThat(resposta.podeIniciar()).isFalse();
        assertThatThrownBy(() -> service.iniciar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.cancelar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao())).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void rejeitaInicioForaDaJanelaOuAindaPendente() {
        var distante = consulta(agora().plusHours(1), "CONFIRMADA");
        var pendente = consulta(agora().plusMinutes(5), "AGUARDANDO_CONFIRMACAO");
        for (var consulta : java.util.List.of(distante, pendente)) {
            assertThatThrownBy(() -> service.iniciar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao())).isInstanceOf(IllegalArgumentException.class);
            assertThat(consulta.getIniciadaEm()).isNull();
        }
    }
    @Test void criacaoLivrePermaneceBloqueada() {
        assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), null)).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("agendamento");
        assertThat(consultas.count()).isZero();
    }
}
