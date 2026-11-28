package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.CompraRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.EdicaoPublicadaRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.ItemRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.RefeicaoRequest;
import com.nutri4you.backend.email.AsyncEmailDispatcher;
import com.nutri4you.backend.exception.PlanoConflitoException;
import com.nutri4you.backend.exception.PlanoNaoEncontradoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.support.TestDataFactory;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:edicao-dieta;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@DirtiesContext
class EdicaoDietaPublicadaTest {
    @Autowired PrescricaoService prescricoes;
    @Autowired ConsumoRefeicaoService consumos;
    @Autowired NotificacaoPlanoAlimentarService avisos;
    @Autowired PacienteRepository pacientes;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired RelacaoClinicaRepository relacoes;
    @Autowired PasswordEncoder encoder;
    @Autowired EntityManager em;
    @Autowired PlatformTransactionManager txManager;
    @MockitoBean Clock relogio;
    @MockitoBean AsyncEmailDispatcher emails;

    @Test
    void edicaoTransacionalPreservaHojeEAlternaNaMeiaNoiteDaClinica() throws Exception {
        LocalDate hoje = LocalDate.of(2026, 11, 27);
        LocalDate amanha = hoje.plusDays(1);
        LocalDate fim = hoje.plusDays(7);
        when(relogio.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
        when(relogio.instant()).thenReturn(Instant.parse("2026-11-28T02:59:59Z"));

        TransactionTemplate transacao = new TransactionTemplate(txManager);
        Cenario cenario = transacao.execute(status -> {
            Paciente paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
            Nutricionista autor = nutricionistas.save(TestDataFactory.nutricionista(encoder));
            Nutricionista outro = nutricionistas.save(TestDataFactory.nutricionistaConfirmado(
                    "Outro", "outro@exemplo.test", encoder.encode("senha123"), "CRN8-88888"));
            relacoes.save(RelacaoClinica.criar(paciente, autor));
            relacoes.save(RelacaoClinica.criar(paciente, outro));
            em.createNativeQuery("""
                    insert into alimento (id_alimento, nome, nome_busca, kcal_100g, proteina_100g,
                        carboidratos_100g, gordura_100g, disponivel_prescricao, catalogo_ativo)
                    values (3001, 'Arroz', 'arroz', 100, 5, 20, 1, true, true)
                    """).executeUpdate();
            PlanoDTO rascunho = prescricoes.criar(autor, paciente.getId(), null, dados(hoje, fim, "100"));
            PlanoDTO original = prescricoes.publicar(autor, paciente.getId(), null, rascunho.id(), rascunho.versao());
            return new Cenario(autor, outro, paciente, original);
        });
        var original = prescricoes.buscar(cenario.autor(), cenario.paciente().getId(), null, cenario.original().id());
        int refeicaoId = original.refeicoes().getFirst().id();
        consumos.marcar(cenario.paciente(), refeicaoId, new ConsumoRefeicaoService.Marcacao(hoje, true));
        prescricoes.marcar(cenario.paciente(), 3001, new CompraRequest(original.id(), 7, true));

        var edicao = new EdicaoPublicadaRequest(original.versao(), dados(hoje, fim, "200"));
        assertThatThrownBy(() -> prescricoes.criarEdicao(cenario.outro(), cenario.paciente().getId(), null, original.id(), edicao))
                .isInstanceOf(PlanoNaoEncontradoException.class);
        PlanoDTO rascunho = prescricoes.criarEdicao(cenario.autor(), cenario.paciente().getId(), null, original.id(), edicao);
        assertThat(rascunho.planoAnteriorId()).isEqualTo(original.id());
        assertThat(rascunho.vigenciaInicio()).isEqualTo(amanha);
        assertThat(prescricoes.ativo(cenario.paciente()).refeicoes()).isEqualTo(original.refeicoes());
        assertThatThrownBy(() -> prescricoes.criarEdicao(cenario.autor(), cenario.paciente().getId(), null, original.id(), edicao))
                .isInstanceOf(PlanoConflitoException.class);
        assertThatThrownBy(() -> publicar(cenario, rascunho, hoje)).isInstanceOf(PlanoConflitoException.class);

        transacao.executeWithoutResult(status -> {
            publicar(cenario, rascunho, amanha);
            verifyNoInteractions(emails);
            status.setRollbackOnly();
        });
        assertThat(prescricoes.ativo(cenario.paciente()).status()).isEqualTo("PUBLICADO");
        assertThat(avisos.listar(cenario.paciente())).hasSize(1);
        verifyNoInteractions(emails);

        doThrow(new IllegalStateException("SMTP indisponível")).when(emails)
                .enviarFormatado(anyString(), anyString(), anyString(), anyString());
        CountDownLatch partida = new CountDownLatch(1);
        try (var threads = Executors.newFixedThreadPool(2)) {
            var primeiro = threads.submit(() -> tentarPublicar(partida, cenario, rascunho, amanha));
            var segundo = threads.submit(() -> tentarPublicar(partida, cenario, rascunho, amanha));
            partida.countDown();
            assertThat(List.of(primeiro.get(15, TimeUnit.SECONDS), segundo.get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
        }

        assertThat(prescricoes.ativo(cenario.paciente()).id()).isEqualTo(original.id());
        assertThat(prescricoes.compras(cenario.paciente(), 7).itens().getFirst().comprado()).isTrue();
        assertThat(avisos.listar(cenario.paciente())).hasSize(2);
        assertThat(avisos.listar(cenario.paciente()).getFirst().edicaoAgendada()).isTrue();
        verify(emails).enviarFormatado(eq(cenario.paciente().getEmail()), contains("atualizada"),
                contains("28/11/2026"), contains("28/11/2026"));

        var historico = prescricoes.buscar(cenario.autor(), cenario.paciente().getId(), null, original.id());
        assertThat(historico.status()).isEqualTo("SUBSTITUIDO");
        assertThat(historico.vigenciaFim()).isEqualTo(hoje);
        assertThat(historico.substituidaEm()).isEqualTo(hoje);
        assertThat(historico.planoSubstitutoId()).isEqualTo(rascunho.id());
        assertThat(historico.refeicoes()).isEqualTo(original.refeicoes());

        when(relogio.instant()).thenReturn(Instant.parse("2026-11-28T03:00:00Z"));
        assertThat(prescricoes.ativo(cenario.paciente()).id()).isEqualTo(rascunho.id());
        assertThat(prescricoes.ativo(cenario.paciente()).vigenciaFim()).isEqualTo(fim);
        assertThat(prescricoes.compras(cenario.paciente(), 7).itens().getFirst().comprado()).isFalse();
        assertThatThrownBy(() -> prescricoes.marcar(cenario.paciente(), 3001, new CompraRequest(original.id(), 7, true)))
                .isInstanceOf(PlanoConflitoException.class);
        var consumoAnterior = consumos.consultar(cenario.paciente(), hoje);
        assertThat(consumoAnterior.refeicoes().getFirst().id()).isEqualTo(refeicaoId);
        assertThat(consumoAnterior.refeicoes().getFirst().consumida()).isTrue();
        assertThat(consumoAnterior.totais().kcal()).isEqualByComparingTo("100");
        assertThat(consumos.consultar(cenario.paciente(), amanha).refeicoes().getFirst().id()).isNotEqualTo(refeicaoId);
    }

    private PlanoDTO publicar(Cenario cenario, PlanoDTO rascunho, LocalDate inicio) {
        return prescricoes.publicar(cenario.autor(), cenario.paciente().getId(), null,
                rascunho.id(), rascunho.versao(), inicio);
    }

    private boolean tentarPublicar(CountDownLatch partida, Cenario cenario, PlanoDTO rascunho, LocalDate inicio)
            throws InterruptedException {
        partida.await();
        try {
            publicar(cenario, rascunho, inicio);
            return true;
        } catch (PlanoConflitoException conflito) {
            return false;
        }
    }

    private PlanoRequest dados(LocalDate inicio, LocalDate fim, String gramas) {
        return new PlanoRequest("Dieta", null, inicio, fim, null, null,
                List.of(new RefeicaoRequest("Almoço", LocalTime.NOON,
                        List.of(new ItemRequest(3001, new BigDecimal(gramas))))));
    }

    private record Cenario(Nutricionista autor, Nutricionista outro, Paciente paciente, PlanoDTO original) {}
}
