package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.*;
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
    @Autowired PrescricaoService service;
    private Alimento alimento() { return alimentos.saveAndFlush(new Alimento("Feijão teste", new BigDecimal("76.42"), new BigDecimal("4.78"), new BigDecimal("13.59"), BigDecimal.ONE)); }
    private RefeicaoRequest dados(Alimento alimento, String gramas, int dia) {
        return new RefeicaoRequest("Almoço", LocalTime.NOON, dia, List.of(new ItemRequest(alimento.getId(), new BigDecimal(gramas))));
    }
    @Test void calculaPorcaoAcimaDaMetaEPreservaFibraAusente() {
        var plano = rascunho(hoje(), hoje());
        var salvo = service.salvarRefeicao(nutri, paciente.getId(), plano.getId(), null, dados(alimento(), "250", hoje().getDayOfWeek().getValue()), plano.getVersao());
        var refeicao = salvo.refeicoes().getFirst();
        assertThat(refeicao.totais().kcal()).isEqualByComparingTo("191.05");
        assertThat(refeicao.totais().fibras()).isNull();
        assertThat(refeicao.totais().kcal()).isGreaterThan(salvo.metas().kcal());
    }
    @Test void replicasSaoIndependentesEPreservamSubstitutosEDiasExistentes() {
        var plano = rascunho(hoje(), hoje()); var alimento = alimento(); var sub = alimento();
        var req = new RefeicaoRequest("Almoço", LocalTime.NOON, 1, List.of(new ItemRequest(alimento.getId(), BigDecimal.valueOf(250), List.of(new SubstitutoRequest(sub.getId(), BigDecimal.valueOf(50))))));
        int origem = service.salvarRefeicao(nutri, paciente.getId(), plano.getId(), null, req, plano.getVersao()).refeicoes().getFirst().id();
        service.salvarRefeicao(nutri, paciente.getId(), plano.getId(), null, dados(alimento, "50", 2), plano.getVersao());
        var copiado = service.replicarRefeicao(nutri, paciente.getId(), plano.getId(), origem, List.of(2, 7), plano.getVersao());
        assertThat(copiado.refeicoes()).hasSize(4);
        assertThat(copiado.refeicoes().stream().filter(ref -> ref.diaSemana() == 7).findFirst().orElseThrow().itens().getFirst().substitutos()).hasSize(1);
        var depois = service.excluirRefeicao(nutri, paciente.getId(), plano.getId(), origem, plano.getVersao());
        assertThat(depois.refeicoes()).hasSize(3);
        assertThat(depois.refeicoes().stream().filter(ref -> ref.diaSemana() == 2).map(ref -> ref.itens().getFirst().quantidadeGramas())).containsExactlyInAnyOrder(new BigDecimal("50"), new BigDecimal("250"));
    }
    @Test void rejeitaQuantidadeInvalidaEDiaForaDaSemana() {
        var plano = rascunho(hoje(), hoje()); var alimento = alimento();
        for (String gramas : new String[]{"0", "-1", "10001", "0.001"})
            assertThatThrownBy(() -> service.salvarRefeicao(nutri, paciente.getId(), plano.getId(), null, dados(alimento, gramas, 1), plano.getVersao())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.salvarRefeicao(nutri, paciente.getId(), plano.getId(), null, dados(alimento, "100", 8), plano.getVersao())).isInstanceOf(IllegalArgumentException.class);
        assertThat(plano.getRefeicoes()).isEmpty();
    }
    @Test void rejeitaReplicacaoParaOrigemOuDiasRepetidos() {
        var plano = rascunho(hoje(), hoje());
        int id = service.salvarRefeicao(nutri, paciente.getId(), plano.getId(), null, dados(alimento(), "100", 1), plano.getVersao()).refeicoes().getFirst().id();
        for (var dias : List.of(List.of(1), List.of(2, 2), List.<Integer>of()))
            assertThatThrownBy(() -> service.replicarRefeicao(nutri, paciente.getId(), plano.getId(), id, dias, plano.getVersao())).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void versaoAntigaNaoPodeExcluirRefeicao() {
        var plano = rascunho(hoje(), hoje()); long antiga = plano.getVersao();
        int id = service.salvarRefeicao(nutri, paciente.getId(), plano.getId(), null, dados(alimento(), "100", 1), antiga).refeicoes().getFirst().id();
        assertThatThrownBy(() -> service.excluirRefeicao(nutri, paciente.getId(), plano.getId(), id, antiga)).isInstanceOf(PlanoConflitoException.class);
    }
}
