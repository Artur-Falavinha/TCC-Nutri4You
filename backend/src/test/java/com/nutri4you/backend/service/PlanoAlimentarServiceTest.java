package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.*;
import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class PlanoAlimentarServiceTest extends ClinicalServiceTestSupport {
    @Autowired PrescricaoService service;
    private PlanoRequest dados(LocalDate inicio, LocalDate fim, Long versao) {
        var alimento = alimentos.saveAndFlush(new Alimento("Feijão", BigDecimal.valueOf(100), BigDecimal.TEN, BigDecimal.TEN, BigDecimal.ONE));
        return new PlanoRequest("Plano semanal", null, inicio, fim, new Nutrientes(BigDecimal.ONE, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN), versao,
                List.of(new RefeicaoRequest("Almoço", LocalTime.NOON, hoje().getDayOfWeek().getValue(), List.of(new ItemRequest(alimento.getId(), BigDecimal.valueOf(250))))));
    }
    private PlanoDTO publicado(LocalDate inicio, LocalDate fim) {
        var p = service.criar(nutri, paciente.getId(), dados(inicio, fim, null));
        return service.publicar(nutri, paciente.getId(), p.id(), p.versao());
    }
    @Test void bloqueiaTodaSobreposicaoSemAlterarPlanoAnterior() {
        var anterior = publicado(hoje(), hoje().plusDays(10));
        var novo = service.criar(nutri, paciente.getId(), dados(hoje().plusDays(3), hoje().plusDays(12), null));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), novo.id(), novo.versao())).isInstanceOf(PlanoConflitoException.class);
        var preservado = service.buscar(nutri, paciente.getId(), anterior.id());
        assertThat(preservado.status()).isEqualTo("PUBLICADO");
        assertThat(preservado.vigenciaFim()).isEqualTo(anterior.vigenciaFim());
        assertThat(preservado.versao()).isEqualTo(anterior.versao());
    }
    @Test void datasIguaisTambemSaoSobreposicao() {
        publicado(hoje(), hoje().plusDays(10));
        var novo = service.criar(nutri, paciente.getId(), dados(hoje(), hoje().plusDays(3), null));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), novo.id(), novo.versao())).isInstanceOf(PlanoConflitoException.class);
    }
    @Test void permiteVigenciasAdjacentesEPreservaHistorico() {
        var anterior = publicado(hoje(), hoje().plusDays(6));
        var proximo = publicado(hoje().plusDays(7), hoje().plusDays(13));
        assertThat(service.ativo(paciente).id()).isEqualTo(anterior.id());
        assertThat(service.listar(nutri, paciente.getId())).extracting(PlanoDTO::id).containsExactly(proximo.id(), anterior.id());
    }
    @Test void publicacaoExigeRefeicoesEFimExplicito() {
        var semFim = service.criar(nutri, paciente.getId(), dados(hoje(), null, null));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), semFim.id(), semFim.versao())).isInstanceOf(IllegalArgumentException.class);
        var vazio = service.criar(nutri, paciente.getId(), new PlanoRequest("Vazio", null, hoje(), hoje(), null, null, List.of()));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), vazio.id(), vazio.versao())).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void versaoAntigaEPlanoPublicadoNaoPermitemEdicao() {
        var plano = service.criar(nutri, paciente.getId(), dados(hoje(), hoje(), null));
        assertThatThrownBy(() -> service.editar(nutri, paciente.getId(), plano.id(), dados(hoje(), hoje(), 99L))).isInstanceOf(PlanoConflitoException.class);
        var pub = service.publicar(nutri, paciente.getId(), plano.id(), plano.versao());
        assertThatThrownBy(() -> service.editar(nutri, paciente.getId(), pub.id(), dados(hoje(), hoje(), pub.versao()))).isInstanceOf(PlanoConflitoException.class);
    }
    @Test void outroAutorVinculadoNaoPodeAlterarPlano() {
        var plano = service.criar(nutri, paciente.getId(), dados(hoje(), hoje(), null));
        var outro = nutricionistas.save(new Nutricionista("Outro", "outro@teste.com", "hash", "CRN8-12345"));
        relacoes.save(RelacaoClinica.criar(paciente, outro));
        assertThatThrownBy(() -> service.editar(outro, paciente.getId(), plano.id(), dados(hoje(), hoje(), plano.versao()))).isInstanceOf(PlanoNaoEncontradoException.class);
    }
    @Test void comprasConsideramHojeDiasDaSemanaEVigenciaSemSubstitutos() {
        var alimento = alimentos.saveAndFlush(new Alimento("Principal", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        var sub = alimentos.saveAndFlush(new Alimento("Alternativo", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        int hojeDia = hoje().getDayOfWeek().getValue();
        var refeicoes = List.of(
                new RefeicaoRequest("Hoje", LocalTime.NOON, hojeDia, List.of(new ItemRequest(alimento.getId(), BigDecimal.valueOf(100), List.of(new SubstitutoRequest(sub.getId(), BigDecimal.valueOf(50)))))),
                new RefeicaoRequest("Amanhã", LocalTime.NOON, hoje().plusDays(1).getDayOfWeek().getValue(), List.of(new ItemRequest(alimento.getId(), BigDecimal.valueOf(200)))));
        var p = service.criar(nutri, paciente.getId(), new PlanoRequest("Compras", null, hoje(), hoje().plusDays(7), null, null, refeicoes));
        service.publicar(nutri, paciente.getId(), p.id(), p.versao());
        assertThat(service.compras(paciente, 1).itens().getFirst().quantidadeGramas()).isEqualByComparingTo("100");
        assertThat(service.compras(paciente, 7).itens().getFirst().quantidadeGramas()).isEqualByComparingTo("300");
        var compras = service.compras(paciente, 30);
        assertThat(compras.itens()).hasSize(1);
        assertThat(compras.itens().getFirst().quantidadeGramas()).isEqualByComparingTo("400");
        assertThatThrownBy(() -> service.compras(paciente, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.compras(paciente, 31)).isInstanceOf(IllegalArgumentException.class);
    }
}
