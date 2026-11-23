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
    @Autowired GestaoPacienteService gestao;
    @Autowired ConsumoRefeicaoService consumo;
    private PlanoRequest dados(LocalDate inicio, LocalDate fim, Long versao) {
        var alimento = alimentos.saveAndFlush(new Alimento("Feijão", BigDecimal.valueOf(100), BigDecimal.TEN, BigDecimal.TEN, BigDecimal.ONE));
        return new PlanoRequest("Plano semanal", null, inicio, fim, new Nutrientes(BigDecimal.ONE, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN), versao,
                List.of(new RefeicaoRequest("Almoço", LocalTime.NOON, hoje().getDayOfWeek().getValue(), List.of(new ItemRequest(alimento.getId(), BigDecimal.valueOf(250))))));
    }
    private PlanoDTO publicado(LocalDate inicio, LocalDate fim) {
        var p = service.criar(nutri, paciente.getId(), null, dados(inicio, fim, null));
        return service.publicar(nutri, paciente.getId(), null, p.id(), p.versao());
    }

    @Test void desvinculoPreservaPlanoVigenteParaPacienteMasBloqueiaNutricionista() {
        var plano = publicado(hoje(), hoje().plusDays(7));
        var pendente = service.criar(nutri, paciente.getId(), null, dados(hoje().plusDays(8), null, null));
        gestao.desvincularPaciente(paciente, nutri.getId());
        assertThat(service.ativo(paciente).id()).isEqualTo(plano.id());
        assertThat(service.compras(paciente, 7).planoId()).isEqualTo(plano.id());
        assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), null, dados(hoje().plusDays(8), null, null)))
                .isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), null, pendente.id(), pendente.versao()))
                .isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> service.buscar(nutri, paciente.getId(), null, plano.id()))
                .isInstanceOf(AcessoNegadoException.class);
    }
    @Test void rejeitaDatasPassadasAoCriarEOInicioPassadoAoPublicar() {
        assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), null,
                dados(hoje().minusDays(1), hoje().plusDays(7), null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Início da vigência");
        assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), null,
                dados(null, hoje().minusDays(1), null)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Fim da vigência");
        var rascunho = rascunho(hoje().minusDays(1), hoje().plusDays(7));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), null, rascunho.getId(), rascunho.getVersao()))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Início da vigência");
    }

    @Test void excluiPublicadoComVersaoAtualEPreservaConsumoRegistrado() {
        var plano = publicado(hoje(), hoje().plusDays(7));
        int refeicaoId = plano.refeicoes().getFirst().id();
        consumo.marcar(paciente, refeicaoId, new ConsumoRefeicaoService.Marcacao(hoje(), true));
        var outro = nutricionistas.save(new Nutricionista("Outro", "outro@teste.com", "hash", "CRN8-12345"));
        relacoes.save(RelacaoClinica.criar(paciente, outro));
        assertThatThrownBy(() -> service.excluir(outro, paciente.getId(), null, plano.id(), plano.versao()))
                .isInstanceOf(PlanoNaoEncontradoException.class);
        assertThatThrownBy(() -> service.excluir(nutri, paciente.getId(), null, plano.id(), plano.versao() - 1))
                .isInstanceOf(PlanoConflitoException.class);
        service.excluir(nutri, paciente.getId(), null, plano.id(), plano.versao());
        assertThat(service.listar(nutri, paciente.getId(), null)).isEmpty();
        assertThatThrownBy(() -> service.buscar(nutri, paciente.getId(), null, plano.id()))
                .isInstanceOf(PlanoNaoEncontradoException.class);
        assertThat(service.ativo(paciente)).isNull();
        assertThat(service.compras(paciente, 7)).isNull();
        assertThat(consumo.consultar(paciente, hoje()).refeicoes())
                .extracting(ConsumoRefeicaoService.RefeicaoConsumo::consumida).containsExactly(true);
        assertThat(publicado(hoje(), hoje().plusDays(7)).status()).isEqualTo("PUBLICADO");
    }

    @Test void permiteNovaPrescricaoNoMesmoAtendimentoAvulsoAposRetirarOPlano() {
        relacoes.delete(relacoes.findByPaciente_IdAndNutricionista_Id(paciente.getId(), nutri.getId()).orElseThrow());
        var consulta = new Consulta(paciente, nutri, agora(), true);
        consulta.atualizar(agora(), "CONFIRMADA", null);
        consulta.iniciar(agora());
        int atendimentoId = consultas.saveAndFlush(consulta).getId();

        var rascunho = service.criar(nutri, paciente.getId(), atendimentoId, dados(hoje(), hoje().plusDays(7), null));
        var plano = service.publicar(nutri, paciente.getId(), atendimentoId, rascunho.id(), rascunho.versao());
        assertThatThrownBy(() -> service.criar(nutri, paciente.getId(), atendimentoId, dados(hoje(), null, null)))
                .isInstanceOf(PlanoConflitoException.class);
        service.excluir(nutri, paciente.getId(), atendimentoId, plano.id(), plano.versao());
        var novo = service.criar(nutri, paciente.getId(), atendimentoId, dados(hoje(), null, null));
        assertThat(service.listar(nutri, paciente.getId(), atendimentoId)).extracting(PlanoDTO::id).containsExactly(novo.id());
        assertThat(planos.findById(plano.id()).orElseThrow().getConsulta().getId()).isEqualTo(atendimentoId);
    }

    @Test void calculaGramasAPartirDasCaloriasEDosPercentuais() {
        var request = new PlanoRequest("Meta percentual", null, hoje(), hoje().plusDays(7),
                new Nutrientes(new BigDecimal("1700"), null, null, null), null, List.of(), null,
                new DistribuicaoMacros(new BigDecimal("50"), new BigDecimal("30"), new BigDecimal("20")));

        var plano = service.criar(nutri, paciente.getId(), null, request);

        assertThat(plano.metas().proteinas()).isEqualByComparingTo("212.50");
        assertThat(plano.metas().carboidratos()).isEqualByComparingTo("127.50");
        assertThat(plano.metas().gorduras()).isEqualByComparingTo("37.78");
        assertThat(plano.percentuais().proteinas()).isEqualByComparingTo("50");
    }
    @Test void bloqueiaTodaSobreposicaoSemAlterarPlanoAnterior() {
        var anterior = publicado(hoje(), hoje().plusDays(10));
        var novo = service.criar(nutri, paciente.getId(), null, dados(hoje().plusDays(3), hoje().plusDays(12), null));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), null, novo.id(), novo.versao())).isInstanceOf(PlanoConflitoException.class);
        var preservado = service.buscar(nutri, paciente.getId(), null, anterior.id());
        assertThat(preservado.status()).isEqualTo("PUBLICADO");
        assertThat(preservado.vigenciaFim()).isEqualTo(anterior.vigenciaFim());
        assertThat(preservado.versao()).isEqualTo(anterior.versao());
    }
    @Test void datasIguaisTambemSaoSobreposicao() {
        publicado(hoje(), hoje().plusDays(10));
        var novo = service.criar(nutri, paciente.getId(), null, dados(hoje(), hoje().plusDays(3), null));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), null, novo.id(), novo.versao())).isInstanceOf(PlanoConflitoException.class);
    }
    @Test void permiteVigenciasAdjacentesEPreservaHistorico() {
        var anterior = publicado(hoje(), hoje().plusDays(6));
        var proximo = publicado(hoje().plusDays(7), hoje().plusDays(13));
        assertThat(service.ativo(paciente).id()).isEqualTo(anterior.id());
        assertThat(service.listar(nutri, paciente.getId(), null)).extracting(PlanoDTO::id).containsExactly(proximo.id(), anterior.id());
    }
    @Test void publicacaoExigeRefeicoesEFimExplicito() {
        var semFim = service.criar(nutri, paciente.getId(), null, dados(hoje(), null, null));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), null, semFim.id(), semFim.versao())).isInstanceOf(IllegalArgumentException.class);
        var vazio = service.criar(nutri, paciente.getId(), null, new PlanoRequest("Vazio", null, hoje(), hoje(), null, null, List.of()));
        assertThatThrownBy(() -> service.publicar(nutri, paciente.getId(), null, vazio.id(), vazio.versao())).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void versaoAntigaEPlanoPublicadoNaoPermitemEdicao() {
        var plano = service.criar(nutri, paciente.getId(), null, dados(hoje(), hoje(), null));
        assertThatThrownBy(() -> service.editar(nutri, paciente.getId(), null, plano.id(), dados(hoje(), hoje(), 99L))).isInstanceOf(PlanoConflitoException.class);
        var pub = service.publicar(nutri, paciente.getId(), null, plano.id(), plano.versao());
        assertThatThrownBy(() -> service.editar(nutri, paciente.getId(), null, pub.id(), dados(hoje(), hoje(), pub.versao()))).isInstanceOf(PlanoConflitoException.class);
    }
    @Test void outroAutorVinculadoNaoPodeAlterarPlano() {
        var plano = service.criar(nutri, paciente.getId(), null, dados(hoje(), hoje(), null));
        var outro = nutricionistas.save(new Nutricionista("Outro", "outro@teste.com", "hash", "CRN8-12345"));
        relacoes.save(RelacaoClinica.criar(paciente, outro));
        assertThatThrownBy(() -> service.editar(outro, paciente.getId(), null, plano.id(), dados(hoje(), hoje(), plano.versao()))).isInstanceOf(PlanoNaoEncontradoException.class);
    }
    @Test void comprasConsideramHojeDiasDaSemanaEVigenciaSemSubstitutos() {
        var alimento = alimentos.saveAndFlush(new Alimento("Principal", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        var sub = alimentos.saveAndFlush(new Alimento("Alternativo", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE));
        int hojeDia = hoje().getDayOfWeek().getValue();
        var refeicoes = List.of(
                new RefeicaoRequest("Hoje", LocalTime.NOON, hojeDia, List.of(new ItemRequest(alimento.getId(), BigDecimal.valueOf(100), List.of(new SubstitutoRequest(sub.getId(), BigDecimal.valueOf(50)))))),
                new RefeicaoRequest("Amanhã", LocalTime.NOON, hoje().plusDays(1).getDayOfWeek().getValue(), List.of(new ItemRequest(alimento.getId(), BigDecimal.valueOf(200)))));
        var p = service.criar(nutri, paciente.getId(), null, new PlanoRequest("Compras", null, hoje(), hoje().plusDays(7), null, null, refeicoes));
        service.publicar(nutri, paciente.getId(), null, p.id(), p.versao());
        assertThat(service.compras(paciente, 1).itens().getFirst().quantidadeGramas()).isEqualByComparingTo("100");
        assertThat(service.compras(paciente, 7).itens().getFirst().quantidadeGramas()).isEqualByComparingTo("300");
        var compras = service.compras(paciente, 30);
        assertThat(compras.itens()).hasSize(1);
        assertThat(compras.itens().getFirst().quantidadeGramas()).isEqualByComparingTo("400");
        assertThatThrownBy(() -> service.compras(paciente, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.compras(paciente, 31)).isInstanceOf(IllegalArgumentException.class);
    }
}
