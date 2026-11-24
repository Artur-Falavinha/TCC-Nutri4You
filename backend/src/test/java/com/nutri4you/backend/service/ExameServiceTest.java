package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import com.nutri4you.backend.dto.ExameResponse;
import com.nutri4you.backend.dto.NotificacaoExameDTO;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.NotificacaoExame.Tipo;
import com.nutri4you.backend.support.TestDataFactory;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import static org.assertj.core.api.Assertions.*;

class ExameServiceTest extends ClinicalServiceTestSupport {
    @Autowired ExameService service;
    @Autowired EntityManager entityManager;
    @Autowired NotificacaoExameService notificacoes;
    @Autowired GestaoPacienteService gestao;
    private MockMultipartFile pdf(int size) {
        byte[] bytes = new byte[size]; System.arraycopy("%PDF-1.4".getBytes(java.nio.charset.StandardCharsets.US_ASCII), 0, bytes, 0, 8);
        return new MockMultipartFile("arquivo", "resultado.pdf", "application/pdf", bytes);
    }
    private ExameResponse pedido() { return service.solicitar(nutri, paciente.getId(), null, new ExameService.Solicitacao("Hemograma", "Orientação")); }

    @Test void avisaCadaDestinatarioEExibeSomenteOResultadoAtualPendente() {
        var exame = pedido();
        assertThat(notificacoes.listarPaciente(paciente)).extracting(NotificacaoExameDTO::tipo)
                .containsExactly(Tipo.SOLICITADO);
        assertThat(notificacoes.listarResultados(nutri)).isEmpty();

        var enviado = service.enviar(paciente, exame.id(), exame.versao(), pdf(20));
        var primeiro = notificacoes.listarResultados(nutri).getFirst();
        assertThat(primeiro.exameNome()).isEqualTo("Hemograma");
        assertThat(primeiro.pacienteId()).isEqualTo(paciente.getId());
        assertThat(primeiro.atendimentoId()).isNull();
        assertThatThrownBy(() -> service.enviar(paciente, exame.id(), exame.versao(), pdf(20)))
                .isInstanceOf(ConsultaConflitoException.class);
        assertThat(notificacoes.listarResultados(nutri)).containsExactly(primeiro);

        var substituido = service.enviar(paciente, exame.id(), enviado.versao(), pdf(30));
        assertThat(notificacoes.listarResultados(nutri)).singleElement()
                .satisfies(resultado -> assertThat(resultado.id()).isNotEqualTo(primeiro.id()));
        service.analisar(nutri, paciente.getId(), null, exame.id(), new ExameService.Analise("Revisado", substituido.versao()));

        assertThat(notificacoes.listarResultados(nutri)).isEmpty();
        assertThat(notificacoes.listarPaciente(paciente)).extracting(NotificacaoExameDTO::tipo)
                .containsExactly(Tipo.PARECER_REGISTRADO, Tipo.SOLICITADO);
        assertThat(notificacoes.listarPaciente(pacientes.save(TestDataFactory.outroPaciente(encoder)))).isEmpty();
    }

    @Test void resultadoDeAtendimentoAbreNoEscopoClinicoEODesvinculoRetiraOAviso() {
        var consulta = new Consulta(paciente, nutri, agora().plusHours(1), true);
        consulta.atualizar(consulta.getDataHora(), "CONFIRMADA", null);
        consulta.iniciar(agora());
        consultas.saveAndFlush(consulta);
        var exame = service.solicitar(nutri, paciente.getId(), consulta.getId(), new ExameService.Solicitacao("Exame", null));
        service.enviar(paciente, exame.id(), exame.versao(), pdf(20));

        assertThat(notificacoes.listarResultados(nutri)).singleElement()
                .satisfies(resultado -> assertThat(resultado.atendimentoId()).isEqualTo(consulta.getId()));
        gestao.desvincularNutricionista(nutri, paciente.getId());
        assertThat(notificacoes.listarResultados(nutri)).isEmpty();
        assertThat(notificacoes.listarPaciente(paciente)).extracting(NotificacaoExameDTO::tipo)
                .containsExactly(Tipo.SOLICITADO);
    }
    @Test void aceitaLimiteExatoRejeitaExcessoEConteudoIncompativel() {
        var e = pedido();
        assertThat(service.enviar(paciente, e.id(), e.versao(), pdf(5 * 1024 * 1024)).arquivoTamanho()).isEqualTo(5L * 1024 * 1024);
        var atual = service.listar(paciente, 0).itens().getFirst();
        assertThatThrownBy(() -> service.enviar(paciente, e.id(), atual.versao(), pdf(5 * 1024 * 1024 + 1))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.enviar(paciente, e.id(), atual.versao(), new MockMultipartFile("arquivo", "fake.png", "image/png", "%PDF-1.4".getBytes()))).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void removeESubstituiAntesDaAnaliseComControleDeVersao() {
        var e = pedido();
        var enviado = service.enviar(paciente, e.id(), e.versao(), pdf(20));
        assertThatThrownBy(() -> service.remover(paciente, e.id(), e.versao())).isInstanceOf(ConsultaConflitoException.class);
        var substituido = service.enviar(paciente, e.id(), enviado.versao(), pdf(30));
        assertThat(substituido.arquivoTamanho()).isEqualTo(30L);
        var removido = service.remover(paciente, e.id(), substituido.versao());
        assertThat(removido.status()).isEqualTo("PENDENTE"); assertThat(removido.arquivoNome()).isNull();
        assertThatThrownBy(() -> service.arquivo(paciente, e.id())).isInstanceOf(ExameNaoEncontradoException.class);
    }
    @Test void analiseBloqueiaRemocaoESubstituicaoEMantemParecer() {
        var e = pedido(); var enviado = service.enviar(paciente, e.id(), e.versao(), pdf(20));
        var analisado = service.analisar(nutri, paciente.getId(), null, e.id(), new ExameService.Analise("Revisado", enviado.versao()));
        assertThatThrownBy(() -> service.remover(paciente, e.id(), analisado.versao())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.enviar(paciente, e.id(), analisado.versao(), pdf(30))).isInstanceOf(IllegalArgumentException.class);
        assertThat(service.listar(paciente, 0).itens().getFirst().parecer()).isEqualTo("Revisado");
    }
    @Test
    void listaEEntregaArquivoLegadoSemMetadados() throws java.io.IOException {
        var exame = pedido();
        service.enviar(paciente, exame.id(), exame.versao(), pdf(20));
        entityManager.createNativeQuery("""
                update exame set arquivo_nome = null, arquivo_tipo = null, arquivo_tamanho = null
                where id_exame = :id
                """).setParameter("id", exame.id()).executeUpdate();
        entityManager.clear();

        var listado = service.listar(paciente, 0).itens().getFirst();
        assertThat(listado.possuiArquivo()).isTrue();
        assertThat(listado.arquivoNome()).isNull();
        var arquivo = service.arquivo(paciente, exame.id());
        assertThat(arquivo.tipo()).isEqualTo("application/octet-stream");
        assertThat(arquivo.dados()).containsExactly(pdf(20).getBytes());
    }

    @Test void arquivoDeOutroPacienteNaoPodeSerLidoOuAlterado() {
        var e = pedido();
        var outro = pacientes.save(com.nutri4you.backend.support.TestDataFactory.outroPaciente(encoder));
        assertThatThrownBy(() -> service.enviar(outro, e.id(), e.versao(), pdf(20))).isInstanceOf(ExameNaoEncontradoException.class);
        assertThatThrownBy(() -> service.remover(outro, e.id(), e.versao())).isInstanceOf(ExameNaoEncontradoException.class);
        assertThatThrownBy(() -> service.arquivo(outro, e.id())).isInstanceOf(ExameNaoEncontradoException.class);
    }
}
