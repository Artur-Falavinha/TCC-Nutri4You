package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.*;
import com.nutri4you.backend.exception.PlanoConflitoException;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class RefeicaoServiceTest extends ClinicalServiceTestSupport {
    @Autowired RefeicaoService service;
    private Alimento alimento() {
        return alimentos.saveAndFlush(new Alimento("Feijão teste", new BigDecimal("76.42"), new BigDecimal("4.78"), new BigDecimal("13.59"), null));
    }
    private RefeicaoRequest dados(PlanoAlimentar plano, Alimento alimento, String gramas, int dia) {
        return new RefeicaoRequest("Almoço", LocalTime.NOON, dia,
                List.of(new RefeicaoRequest.Item(alimento.getId(), new BigDecimal(gramas))), plano.getVersao());
    }
    @Test void calculaPorcaoAcimaDaMetaSemTransformarNutrienteAusenteEmZero() {
        var plano = rascunho(hoje(), null);
        var salvo = service.salvar(nutri, paciente.getId(), plano.getId(), null, dados(plano, alimento(), "250", 1));
        var refeicao = salvo.refeicoes().getFirst();
        assertThat(refeicao.kcal()).isEqualByComparingTo("191.05");
        assertThat(refeicao.proteina()).isEqualByComparingTo("11.95");
        assertThat(refeicao.gordura()).isNull();
        assertThat(refeicao.kcal()).isGreaterThan(salvo.metaKcal());
    }
    @Test void replicasSaoIndependentesEPreservamDiasExistentes() {
        var plano = rascunho(hoje(), null); var alimento = alimento();
        var salvo = service.salvar(nutri, paciente.getId(), plano.getId(), null, dados(plano, alimento, "250", 1));
        int origem = salvo.refeicoes().getFirst().id();
        service.salvar(nutri, paciente.getId(), plano.getId(), null, dados(plano, alimento, "50", 2));
        var copiado = service.replicar(nutri, paciente.getId(), plano.getId(), origem, List.of(2, 7), plano.getVersao());
        assertThat(copiado.refeicoes()).hasSize(4);
        service.salvar(nutri, paciente.getId(), plano.getId(), origem, dados(plano, alimento, "100", 1));
        var depois = service.excluir(nutri, paciente.getId(), plano.getId(), origem, plano.getVersao());
        assertThat(depois.refeicoes()).hasSize(3);
        assertThat(depois.refeicoes().stream().filter(r -> r.diaSemana() == 2).map(r -> r.itens().getFirst().quantidadeGramas()))
                .containsExactlyInAnyOrder(new BigDecimal("50"), new BigDecimal("250"));
    }
    @Test void rejeitaQuantidadeInvalidaEDiaForaDaSemanaSemGravar() {
        var plano = rascunho(hoje(), null); var alimento = alimento();
        for (String gramas : new String[]{"0", "-1", "10000", "0.001"}) {
            assertThatThrownBy(() -> service.salvar(nutri, paciente.getId(), plano.getId(), null, dados(plano, alimento, gramas, 1)))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> service.salvar(nutri, paciente.getId(), plano.getId(), null, dados(plano, alimento, "100", 8)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(plano.getRefeicoes()).isEmpty();
    }
    @Test void rejeitaReplicacaoParaOrigemOuDiasRepetidos() {
        var plano = rascunho(hoje(), null);
        int origem = service.salvar(nutri, paciente.getId(), plano.getId(), null, dados(plano, alimento(), "100", 1)).refeicoes().getFirst().id();
        for (var dias : List.of(List.of(1), List.of(2, 2), List.<Integer>of())) {
            assertThatThrownBy(() -> service.replicar(nutri, paciente.getId(), plano.getId(), origem, dias, plano.getVersao()))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThat(plano.getRefeicoes()).hasSize(1);
    }
    @Test void versaoAntigaNaoPodeExcluirRefeicao() {
        var plano = rascunho(hoje(), null);
        long antiga = plano.getVersao();
        int id = service.salvar(nutri, paciente.getId(), plano.getId(), null, dados(plano, alimento(), "100", 1)).refeicoes().getFirst().id();
        assertThatThrownBy(() -> service.excluir(nutri, paciente.getId(), plano.getId(), id, antiga)).isInstanceOf(PlanoConflitoException.class);
        assertThat(plano.getRefeicoes()).hasSize(1);
    }
}
