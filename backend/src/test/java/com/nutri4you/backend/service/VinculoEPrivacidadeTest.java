package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.support.ClinicalServiceTestSupport;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.*;

class VinculoEPrivacidadeTest extends ClinicalServiceTestSupport {
    @Autowired SolicitacaoVinculoService vinculos;
    @Autowired GestaoPacienteService gestao;
    @Autowired PrivacidadeService privacidade;

    @Test void pacienteSolicitaENutricionistaAceitaSemAtivarSegundoVinculo() {
        var titular = pacientes.save(TestDataFactory.outroPaciente(encoder));
        var outro = nutricionistas.save(new Nutricionista("Profissional extra", "extra@example.test",
                encoder.encode("senha-teste"), "CRN8-98765"));
        assertThat(vinculos.pesquisar("profissional")).contains(new SolicitacaoVinculoService.Profissional(outro.getId(), outro.getNome()));
        vinculos.solicitar(titular, nutri.getId());
        vinculos.solicitar(titular, outro.getId());
        assertThat(vinculos.listar(titular)).isEmpty();
        var primeiro = vinculos.listarRecebidas(nutri).getFirst();
        var segundo = vinculos.listarRecebidas(outro).getFirst();
        assertThatThrownBy(() -> vinculos.decidir(titular, primeiro.id(), primeiro.versao(), true))
                .isInstanceOf(AcessoNegadoException.class);
        vinculos.decidirComoNutricionista(nutri, primeiro.id(), primeiro.versao(), true);
        assertThat(gestao.exigirAcesso(nutri, titular.getId()).getId()).isEqualTo(titular.getId());
        assertThatThrownBy(() -> vinculos.decidirComoNutricionista(outro, segundo.id(), segundo.versao(), true))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("apenas um vínculo ativo");
    }

    @Test void aceiteDosTermosELimitadoAoTitular() {
        var outro = pacientes.save(TestDataFactory.outroPaciente(encoder));
        assertThat(privacidade.aceitou(paciente)).isFalse();
        assertThatThrownBy(() -> privacidade.aceitar(paciente, "invalida")).isInstanceOf(IllegalArgumentException.class);
        privacidade.aceitar(paciente, PrivacidadeService.VERSAO);
        var dataOriginal = privacidade.dataAceite(paciente);
        assertThat(dataOriginal).isNotNull();
        privacidade.aceitar(paciente, PrivacidadeService.VERSAO);
        assertThat(privacidade.dataAceite(paciente)).isEqualTo(dataOriginal);
        assertThat(privacidade.aceitou(paciente)).isTrue();
        assertThat(privacidade.aceitou(outro)).isFalse();
        assertThat(privacidade.dataAceite(outro)).isNull();
    }
}
