package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import com.nutri4you.backend.dto.ExameResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import static org.assertj.core.api.Assertions.*;

class ExameServiceTest extends ClinicalServiceTestSupport {
    @Autowired ExameService service;
    private MockMultipartFile pdf(int size) {
        byte[] bytes = new byte[size]; System.arraycopy("%PDF-1.4".getBytes(java.nio.charset.StandardCharsets.US_ASCII), 0, bytes, 0, 8);
        return new MockMultipartFile("arquivo", "resultado.pdf", "application/pdf", bytes);
    }
    private ExameResponse pedido() { return service.solicitar(nutri, paciente.getId(), new ExameService.Solicitacao("Hemograma", "Orientação")); }
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
        var analisado = service.analisar(nutri, paciente.getId(), e.id(), new ExameService.Analise("Revisado", enviado.versao()));
        assertThatThrownBy(() -> service.remover(paciente, e.id(), analisado.versao())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.enviar(paciente, e.id(), analisado.versao(), pdf(30))).isInstanceOf(IllegalArgumentException.class);
        assertThat(service.listar(paciente, 0).itens().getFirst().parecer()).isEqualTo("Revisado");
    }
    @Test void arquivoDeOutroPacienteNaoPodeSerLidoOuAlterado() {
        var e = pedido();
        var outro = pacientes.save(com.nutri4you.backend.support.TestDataFactory.outroPaciente(encoder));
        assertThatThrownBy(() -> service.enviar(outro, e.id(), e.versao(), pdf(20))).isInstanceOf(ExameNaoEncontradoException.class);
        assertThatThrownBy(() -> service.remover(outro, e.id(), e.versao())).isInstanceOf(ExameNaoEncontradoException.class);
        assertThatThrownBy(() -> service.arquivo(outro, e.id())).isInstanceOf(ExameNaoEncontradoException.class);
    }
}
