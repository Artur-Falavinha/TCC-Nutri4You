package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AvaliacaoRequest;
import com.nutri4you.backend.dto.ConsultaRequest;
import com.nutri4you.backend.exception.ConsultaConflitoException;
import com.nutri4you.backend.model.Anamnese;
import com.nutri4you.backend.model.PerguntaAnamnese;
import com.nutri4you.backend.model.RespostaAnamnese;
import com.nutri4you.backend.repository.AnamneseRepository;
import com.nutri4you.backend.repository.PerguntaAnamneseRepository;
import com.nutri4you.backend.repository.RespostaAnamneseRepository;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.Instant;
import static org.assertj.core.api.Assertions.*;

class ConsultaServiceTest extends ClinicalServiceTestSupport {
    @Autowired ConsultaService service;
    @Autowired AnamneseRepository anamneses;
    @Autowired PerguntaAnamneseRepository perguntas;
    @Autowired RespostaAnamneseRepository respostas;
    @Test void confirmarExigeSolicitacaoFuturaEVersaoAtual() {
        var consulta = consulta(agora().plusDays(1), "AGUARDANDO_CONFIRMACAO");
        assertThatThrownBy(() -> service.confirmar(nutri, paciente.getId(), consulta.getId(), 99L)).isInstanceOf(ConsultaConflitoException.class);
        assertThat(service.confirmar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao()).status()).isEqualTo("CONFIRMADA");
        assertThatThrownBy(() -> service.confirmar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao())).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void iniciarMarcaAtendimentoEImpedeReinicioECancelamento() {
        registrarMedidasLegadasDaAnamnese();
        var consulta = consulta(agora().plusMinutes(5), "CONFIRMADA");
        var resposta = service.iniciar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao());
        assertThat(resposta.iniciadaEm()).isNotNull();
        assertThat(resposta.podeIniciar()).isFalse();
        assertThat(resposta.contextoClinico()).isNotNull();
        assertThat(resposta.contextoClinico().dataNascimento()).isEqualTo(paciente.getDataNascimento());
        assertThat(resposta.contextoClinico().sexo()).isEqualTo(paciente.getSexo());
        assertThat(resposta.contextoClinico().anamneseFinalizada())
                .containsEntry("height", 1.72).containsEntry("weight", 70.5);
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
    @Test void consultaIniciadaPodeSerConcluidaAntesDoHorarioAgendado() {
        var consulta = consulta(agora().plusMinutes(10), "CONFIRMADA");
        var iniciada = service.iniciar(nutri, paciente.getId(), consulta.getId(), consulta.getVersao());
        var avaliacao = new AvaliacaoRequest(
                new BigDecimal("75"), new BigDecimal("1.80"),
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        var request = new ConsultaRequest(
                consulta.getDataHora(), "REALIZADA", "Consulta concluída", avaliacao, iniciada.versao());

        var concluida = service.atualizar(nutri, paciente.getId(), consulta.getId(), request);
        assertThat(concluida.status()).isEqualTo("REALIZADA");
        assertThat(concluida.contextoClinico()).isNull();
    }
    @Test void criacaoLivrePermaneceBloqueada() {
        assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), null)).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("agendamento");
        assertThat(consultas.count()).isZero();
    }

    private void registrarMedidasLegadasDaAnamnese() {
        var anamnese = new Anamnese();
        anamnese.pacienteId = paciente.getId();
        anamnese.nutricionistaId = nutri.getId();
        anamnese.finalizadaEm = Instant.now();
        anamnese.atualizadaEm = anamnese.finalizadaEm;
        anamneses.save(anamnese);
        publicarMedidaLegada("height", "1.72");
        publicarMedidaLegada("weight", "70.5");
    }

    private void publicarMedidaLegada(String codigo, String valor) {
        var pergunta = new PerguntaAnamnese();
        pergunta.codigo = codigo;
        pergunta.texto = codigo;
        pergunta.categoria = "Medidas corporais";
        pergunta.tipo = "number";
        pergunta.ativo = false;
        var resposta = new RespostaAnamnese();
        resposta.pergunta = perguntas.save(pergunta);
        resposta.pacienteId = paciente.getId();
        resposta.texto = valor;
        resposta.atualizadaEm = agora();
        respostas.save(resposta);
    }
}
