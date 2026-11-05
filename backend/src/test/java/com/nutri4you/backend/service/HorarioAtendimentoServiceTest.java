package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.HorarioAtendimentoDTO;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalTime;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class HorarioAtendimentoServiceTest extends ClinicalServiceTestSupport {
    @Autowired HorarioAtendimentoService service;
    @Test void substituiGradeComDomingoELimiteDoFimDoDia() {
        var domingo = new HorarioAtendimentoDTO(7, LocalTime.of(23, 15));
        service.salvar(nutri, List.of(new HorarioAtendimentoDTO(1, LocalTime.of(9, 0))));
        assertThat(service.salvar(nutri, List.of(domingo))).containsExactly(domingo);
        assertThat(service.horarios(nutri.getId(), 1)).isEmpty();
    }
    @Test void fecharGradeNaoApagaConsultasReservadas() {
        var reserva = consulta(agora().plusDays(1), "CONFIRMADA");
        service.salvar(nutri, List.of());
        assertThat(service.listar(nutri)).isEmpty();
        assertThat(consultas.findById(reserva.getId())).isPresent();
    }
    @Test void duplicatasNaoSubstituemGradeAnterior() {
        var horario = new HorarioAtendimentoDTO(2, LocalTime.of(10, 0));
        service.salvar(nutri, List.of(horario));
        assertThatThrownBy(() -> service.salvar(nutri, List.of(horario, horario))).isInstanceOf(IllegalArgumentException.class);
        assertThat(service.listar(nutri)).containsExactly(horario);
    }
    @ParameterizedTest @ValueSource(ints = {0, 8})
    void rejeitaDiaInvalido(int dia) {
        assertThatThrownBy(() -> service.salvar(nutri, List.of(new HorarioAtendimentoDTO(dia, LocalTime.NOON))))
                .isInstanceOf(IllegalArgumentException.class);
    }
    @Test void rejeitaHorarioQueCruzaMeiaNoiteOuTemSegundos() {
        for (var hora : List.of(LocalTime.of(23, 16), LocalTime.of(10, 0, 1))) {
            assertThatThrownBy(() -> service.salvar(nutri, List.of(new HorarioAtendimentoDTO(1, hora))))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
