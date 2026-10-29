package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.support.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.*;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class AgendaPacienteServiceTest extends ClinicalServiceTestSupport {
    @Autowired AgendaPacienteService service;
    @Autowired HorarioAtendimentoService horarios;
    @Autowired ConsultaService atendimento;
    private LocalDate prepararGrade() {
        var dia = hoje().plusDays(7);
        horarios.salvar(nutri, List.of(new HorarioAtendimentoDTO(dia.getDayOfWeek().getValue(), LocalTime.of(9, 0)),
                new HorarioAtendimentoDTO(dia.getDayOfWeek().getValue(), LocalTime.of(9, 30)),
                new HorarioAtendimentoDTO(dia.getDayOfWeek().getValue(), LocalTime.of(9, 45))));
        return dia;
    }
    @Test void reservaBloqueiaSobreposicaoMasPermiteInicioNoLimiteDe45Minutos() {
        var dia = prepararGrade();
        var reserva = service.solicitar(paciente, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(9, 0)));
        assertThat(reserva.status()).isEqualTo("AGUARDANDO_CONFIRMACAO");
        assertThat(service.disponibilidade(paciente, nutri.getId(), dia).horarios()).containsExactly(dia.atTime(9, 45));
        assertThatThrownBy(() -> service.solicitar(paciente, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(9, 30))))
                .isInstanceOf(ConsultaConflitoException.class);
        assertThat(service.solicitar(paciente, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(9, 45))).id()).isNotEqualTo(reserva.id());
    }
    @Test void reagendarVoltaParaPendenteELiberaHorarioAnterior() {
        var dia = prepararGrade();
        var reserva = service.solicitar(paciente, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(9, 0)));
        var confirmada = atendimento.confirmar(nutri, paciente.getId(), reserva.id(), reserva.versao());
        var nova = service.reagendar(paciente, reserva.id(), new ReagendarConsultaRequest(dia.plusWeeks(1).atTime(9, 45), confirmada.versao()));
        assertThat(nova.status()).isEqualTo("AGUARDANDO_CONFIRMACAO");
        assertThat(nova.versao()).isGreaterThan(confirmada.versao());
        assertThat(service.disponibilidade(paciente, nutri.getId(), dia).horarios()).contains(dia.atTime(9, 0));
    }
    @Test void cancelamentoLiberaDisponibilidadeERemoveDaListagem() {
        var dia = prepararGrade();
        var reserva = consulta(dia.atTime(9, 0), "CONFIRMADA");
        assertThat(service.cancelar(paciente, reserva.getId(), reserva.getVersao()).status()).isEqualTo("CANCELADA");
        assertThat(service.listar(paciente)).isEmpty();
        assertThat(service.disponibilidade(paciente, nutri.getId(), dia).horarios()).hasSize(3);
    }
    @Test void pacienteNaoAlteraConsultaAlheiaOuComVersaoAntiga() {
        var dia = prepararGrade();
        var reserva = consulta(dia.atTime(9, 0), "CONFIRMADA");
        var outro = pacientes.save(TestDataFactory.outroPaciente(encoder));
        assertThatThrownBy(() -> service.cancelar(outro, reserva.getId(), reserva.getVersao())).isInstanceOf(ConsultaNaoEncontradaException.class);
        assertThatThrownBy(() -> service.cancelar(paciente, reserva.getId(), reserva.getVersao() + 1)).isInstanceOf(ConsultaConflitoException.class);
        assertThat(reserva.getStatus()).isEqualTo("CONFIRMADA");
    }
    @Test void rejeitaReservaSemVinculoEHorarioForaDaGrade() {
        var dia = prepararGrade();
        var outro = pacientes.save(TestDataFactory.outroPaciente(encoder));
        assertThatThrownBy(() -> service.solicitar(outro, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(9, 0))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.solicitar(paciente, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(12, 0))))
                .isInstanceOf(IllegalArgumentException.class);
    }
    @Test void atendimentoEmAndamentoContinuaVisivelDepoisDoHorarioMarcado() {
        var ativa = consulta(agora().minusMinutes(5), "CONFIRMADA");
        atendimento.iniciar(nutri, paciente.getId(), ativa.getId(), ativa.getVersao());
        consulta(agora().minusDays(1), "CONFIRMADA");
        assertThat(service.listar(paciente)).extracting(ConsultaPacienteResponse::id).containsExactly(ativa.getId());
        ativa.atualizar(ativa.getDataHora(), "REALIZADA", null);
        consultas.flush();
        assertThat(service.listar(paciente)).isEmpty();
    }
}
