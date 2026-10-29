package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PlanoAlimentarRequest;
import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;

class PlanoAlimentarServiceTest extends ClinicalServiceTestSupport {
    @Autowired PlanoAlimentarService service;
    private PlanoAlimentarRequest dados(LocalDate inicio, LocalDate fim, BigDecimal meta, Long versao) {
        return new PlanoAlimentarRequest(null, inicio, fim, meta, null, null, null, versao);
    }
    @Test void validaVigenciaEMetasAntesDeCriarPlano() {
        assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), dados(hoje(), hoje().minusDays(1), BigDecimal.TEN, null)))
                .isInstanceOf(IllegalArgumentException.class);
        for (String valor : new String[]{"-1", "10000", "1.001"}) {
            assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), dados(hoje(), null, new BigDecimal(valor), null)))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThat(planos.count()).isZero();
    }
    @Test void editarExigeVersaoAtualEMantemRascunho() {
        var plano = rascunho(hoje(), null);
        assertThatThrownBy(() -> service.editar(nutri, paciente.getId(), plano.getId(), dados(hoje(), null, BigDecimal.ONE, 99L)))
                .isInstanceOf(PlanoConflitoException.class);
        var salvo = service.editar(nutri, paciente.getId(), plano.getId(), dados(hoje(), null, new BigDecimal("2100"), plano.getVersao()));
        assertThat(salvo.metaKcal()).isEqualByComparingTo("2100");
        assertThat(salvo.status()).isEqualTo("RASCUNHO");
    }
    @Test void publicarEncerraPlanoAnteriorNaVesperaSemApagarHistorico() {
        var anterior = rascunho(hoje(), null);
        service.publicar(nutri, paciente.getId(), anterior.getId(), anterior.getVersao());
        var novo = rascunho(hoje().plusDays(7), null);
        service.publicar(nutri, paciente.getId(), novo.getId(), novo.getVersao());
        assertThat(anterior.getVigenciaFim()).isEqualTo(hoje().plusDays(6));
        assertThat(service.dietaAtiva(paciente).id()).isEqualTo(anterior.getId());
        assertThat(planos.count()).isEqualTo(2);
    }
    @Test void mesmaDataSubstituiAnteriorEMantemApenasUmaDietaAtiva() {
        var anterior = rascunho(hoje(), null);
        service.publicar(nutri, paciente.getId(), anterior.getId(), anterior.getVersao());
        var novo = rascunho(hoje(), null);
        service.publicar(nutri, paciente.getId(), novo.getId(), novo.getVersao());
        assertThat(anterior.getStatus()).isEqualTo("SUBSTITUIDO");
        assertThat(service.dietaAtiva(paciente).id()).isEqualTo(novo.getId());
    }
    @Test void rejeitaSobreposicaoComPlanoFuturoPublicado() {
        var futuro = rascunho(hoje().plusDays(7), null);
        service.publicar(nutri, paciente.getId(), futuro.getId(), futuro.getVersao());
        var novo = rascunho(hoje(), null);
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), novo.getId(), novo.getVersao())).isInstanceOf(PlanoConflitoException.class);
        assertThat(novo.getStatus()).isEqualTo("RASCUNHO");
        assertThat(service.dietaAtiva(paciente)).isNull();
    }
    @Test void outroNutricionistaVinculadoNaoPodeEditarPlanoAlheio() {
        var plano = rascunho(hoje(), null);
        var outro = nutricionistas.save(new Nutricionista("Outro", "outro-nutri@teste.com", "hash", "CRN8-00001"));
        relacoes.save(RelacaoClinica.criar(paciente, outro));
        assertThatThrownBy(() -> service.editar(outro, paciente.getId(), plano.getId(), dados(hoje(), null, BigDecimal.TEN, plano.getVersao())))
                .isInstanceOf(PlanoNaoEncontradoException.class);
    }
    @Test void planoPublicadoNaoAceitaEdicao() {
        var plano = rascunho(hoje(), null);
        service.publicar(nutri, paciente.getId(), plano.getId(), plano.getVersao());
        assertThatThrownBy(() -> service.editar(nutri, paciente.getId(), plano.getId(), dados(hoje(), null, BigDecimal.ONE, plano.getVersao())))
                .isInstanceOf(PlanoConflitoException.class);
    }
}
