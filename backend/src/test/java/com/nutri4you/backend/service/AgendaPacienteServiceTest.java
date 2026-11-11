package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
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
    @Autowired GestaoPacienteService gestao;
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

    @Test void disponibilidadeParaReagendarIgnoraSomenteAConsultaAutorizada() {
        var dia = hoje().plusDays(7);
        int diaDaSemana = dia.getDayOfWeek().getValue();
        horarios.salvar(nutri, List.of(
                new HorarioAtendimentoDTO(diaDaSemana, LocalTime.of(9, 0)),
                new HorarioAtendimentoDTO(diaDaSemana, LocalTime.of(9, 45)),
                new HorarioAtendimentoDTO(diaDaSemana, LocalTime.of(10, 30))));
        var original = consulta(dia.atTime(9, 0), "CONFIRMADA");
        consulta(dia.atTime(9, 45), "CONFIRMADA");
        var outro = pacientes.save(TestDataFactory.outroPaciente(encoder));
        var pendente = consultas.save(new Consulta(outro, nutri, dia.atTime(10, 30), true));

        assertThat(service.disponibilidadeParaReagendar(paciente, original.getId(), nutri.getId(), dia).horarios())
                .containsExactly(dia.atTime(9, 0));
        assertThat(service.disponibilidade(paciente, nutri.getId(), dia).horarios()).isEmpty();
        assertThatThrownBy(() -> service.disponibilidadeParaReagendar(outro, original.getId(), nutri.getId(), dia))
                .isInstanceOf(ConsultaNaoEncontradaException.class);
        assertThatThrownBy(() -> service.disponibilidadeParaReagendar(paciente, original.getId(), -1, dia))
                .isInstanceOf(ConsultaNaoEncontradaException.class);
        assertThatThrownBy(() -> service.disponibilidadeParaReagendar(outro, pendente.getId(), nutri.getId(), dia))
                .isInstanceOf(IllegalArgumentException.class);
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
    @Test void catalogoIncluiVinculadosEQuemAbriuAgendaAvulsaComHorarios() {
        var semVinculo = pacientes.save(TestDataFactory.outroPaciente(encoder));
        assertThat(service.listarNutricionistas(paciente))
                .containsExactly(new NutricionistaAgendaDTO(nutri.getId(), nutri.getNome(), true));
        assertThat(service.listarNutricionistas(semVinculo)).isEmpty();

        horarios.salvarPreferencia(nutri, new PreferenciaAgendaDTO(true));
        assertThat(service.listarNutricionistas(semVinculo)).isEmpty();
        prepararGrade();
        assertThat(service.listarNutricionistas(semVinculo))
                .containsExactly(new NutricionistaAgendaDTO(nutri.getId(), nutri.getNome(), false));

        horarios.salvarPreferencia(nutri, new PreferenciaAgendaDTO(false));
        assertThat(service.listarNutricionistas(semVinculo)).isEmpty();
        assertThat(service.listarNutricionistas(paciente)).hasSize(1);
    }

    @Test void confirmaAvulsaSemCriarVinculoELiberaFichaSoAposConfirmacao() {
        var dia = prepararGrade();
        var semVinculo = pacientes.save(TestDataFactory.outroPaciente(encoder));
        horarios.salvarPreferencia(nutri, new PreferenciaAgendaDTO(true));

        var reserva = service.solicitar(semVinculo, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(9, 0)));
        assertThat(reserva.status()).isEqualTo("AGUARDANDO_CONFIRMACAO");
        assertThat(atendimento.listarAvulsasPendentes(nutri))
                .containsExactly(new SolicitacaoAvulsaDTO(reserva.id(), semVinculo.getNome(), dia.atTime(9, 0), reserva.versao()));
        assertThat(gestao.listarParaNutricionista(nutri)).noneMatch(item -> item.id().equals(semVinculo.getId()));
        assertThatThrownBy(() -> gestao.exigirAcesso(nutri, semVinculo.getId()))
                .isInstanceOf(AcessoNegadoException.class);

        atendimento.decidirAvulsa(nutri, reserva.id(), new DecisaoConsultaRequest(true, reserva.versao()));
        var confirmada = service.listar(semVinculo).getFirst();
        assertThat(confirmada.status()).isEqualTo("CONFIRMADA");
        assertThat(atendimento.listarAvulsasPendentes(nutri)).isEmpty();
        assertThat(gestao.exigirAcesso(nutri, semVinculo.getId())).isEqualTo(semVinculo);
        assertThat(relacoes.findByPaciente_IdAndNutricionista_Id(semVinculo.getId(), nutri.getId())).isEmpty();

        horarios.salvarPreferencia(nutri, new PreferenciaAgendaDTO(false));
        assertThat(service.disponibilidadeParaReagendar(semVinculo, reserva.id(), nutri.getId(), dia).horarios())
                .containsExactly(dia.atTime(9, 0), dia.atTime(9, 30), dia.atTime(9, 45));
        var reagendada = service.reagendar(semVinculo, reserva.id(),
                new ReagendarConsultaRequest(dia.atTime(9, 30), confirmada.versao()));
        assertThat(reagendada.status()).isEqualTo("AGUARDANDO_CONFIRMACAO");
        assertThat(atendimento.listarAvulsasPendentes(nutri)).extracting(SolicitacaoAvulsaDTO::id)
                .containsExactly(reserva.id());
    }

    @Test void recusaAvulsaComVersaoAtualPeloNutricionistaDaConsulta() {
        var dia = prepararGrade();
        var semVinculo = pacientes.save(TestDataFactory.outroPaciente(encoder));
        var outroNutri = nutricionistas.save(new Nutricionista(
                "Outro nutricionista", "outro-nutricionista@example.test", encoder.encode("Senha-teste-01"), "CRN-8-58273"));
        horarios.salvarPreferencia(nutri, new PreferenciaAgendaDTO(true));
        var reserva = service.solicitar(semVinculo, new SolicitarConsultaRequest(nutri.getId(), dia.atTime(9, 0)));

        assertThat(atendimento.listarAvulsasPendentes(outroNutri)).isEmpty();
        assertThatThrownBy(() -> atendimento.decidirAvulsa(outroNutri, reserva.id(),
                new DecisaoConsultaRequest(true, reserva.versao())))
                .isInstanceOf(ConsultaNaoEncontradaException.class);
        assertThatThrownBy(() -> atendimento.decidirAvulsa(nutri, reserva.id(),
                new DecisaoConsultaRequest(true, reserva.versao() + 1)))
                .isInstanceOf(ConsultaConflitoException.class);

        atendimento.decidirAvulsa(nutri, reserva.id(), new DecisaoConsultaRequest(false, reserva.versao()));
        assertThat(service.listar(semVinculo)).extracting(ConsultaPacienteResponse::status).containsExactly("CANCELADA");
        assertThat(service.disponibilidade(semVinculo, nutri.getId(), dia).horarios()).contains(dia.atTime(9, 0));
        assertThat(gestao.listarParaNutricionista(nutri)).noneMatch(item -> item.id().equals(semVinculo.getId()));
        assertThat(relacoes.findByPaciente_IdAndNutricionista_Id(semVinculo.getId(), nutri.getId())).isEmpty();
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
