package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.*;
import com.nutri4you.backend.exception.PlanoNaoEncontradoException;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class ConsumoRefeicaoServiceTest extends ClinicalServiceTestSupport {
    @Autowired PrescricaoService planosService;
    @Autowired ConsumoRefeicaoService service;
    @Autowired ClinicoService clinico;
    @Autowired EntityManager em;
    private int publicar(Integer dia) {
        var a = alimentos.saveAndFlush(new Alimento("Arroz", BigDecimal.valueOf(100), BigDecimal.TEN, BigDecimal.valueOf(20), BigDecimal.ONE));
        var p = planosService.criar(nutri, paciente.getId(), null, new PlanoRequest("Consumo", null, hoje().minusDays(1), hoje().plusDays(10),
                new Nutrientes(BigDecimal.valueOf(2000), BigDecimal.valueOf(100), BigDecimal.valueOf(200), BigDecimal.valueOf(50)), null,
                List.of(new RefeicaoRequest("Almoço", LocalTime.NOON, dia, List.of(new ItemRequest(a.getId(), BigDecimal.valueOf(250)))))));
        return planosService.publicar(nutri, paciente.getId(), null, p.id(), p.versao()).refeicoes().getFirst().id();
    }
    @Test void marcaDesmarcaPersisteEAtualizaDashboardSemDuplicar() {
        int id = publicar(hoje().getDayOfWeek().getValue());
        var request = new ConsumoRefeicaoService.Marcacao(hoje(), true);
        assertThat(service.marcar(paciente, id, request).totais().kcal()).isEqualByComparingTo("250");
        service.marcar(paciente, id, request); em.flush(); em.clear();
        assertThat(service.consultar(paciente, hoje()).refeicoes().getFirst().consumida()).isTrue();
        assertThat(clinico.consumoDiarioProgresso(paciente).caloriasConsumidas()).isEqualTo(250);
        assertThat(service.marcar(paciente, id, new ConsumoRefeicaoService.Marcacao(hoje(), false)).totais().kcal()).isEqualByComparingTo("0");
        assertThat(service.consultar(paciente, hoje()).refeicoes().getFirst().consumida()).isFalse();
    }
    @Test void historicoSomenteLeituraEFuturoBloqueado() {
        int id = publicar(null);
        assertThat(service.consultar(paciente, hoje().minusDays(1)).refeicoes()).hasSize(1);
        assertThat(service.consultar(paciente, hoje().minusDays(1)).editavel()).isFalse();
        for (var data : List.of(hoje().minusDays(1), hoje().plusDays(1)))
            assertThatThrownBy(() -> service.marcar(paciente, id, new ConsumoRefeicaoService.Marcacao(data, true))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.consultar(paciente, hoje().plusDays(1))).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void naoPermiteRefeicaoDeOutroDiaOuOutroPaciente() {
        int id = publicar(hoje().plusDays(1).getDayOfWeek().getValue());
        assertThatThrownBy(() -> service.marcar(paciente, id, new ConsumoRefeicaoService.Marcacao(hoje(), true))).isInstanceOf(PlanoNaoEncontradoException.class);
        var outro = pacientes.save(com.nutri4you.backend.support.TestDataFactory.outroPaciente(encoder));
        assertThatThrownBy(() -> service.marcar(outro, id, new ConsumoRefeicaoService.Marcacao(hoje(), true))).isInstanceOf(PlanoNaoEncontradoException.class);
    }
}
