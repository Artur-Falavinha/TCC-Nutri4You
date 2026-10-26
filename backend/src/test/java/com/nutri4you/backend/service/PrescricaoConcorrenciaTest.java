package com.nutri4you.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nutri4you.backend.dto.PrescricaoDTO.ItemRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.RefeicaoRequest;
import com.nutri4you.backend.exception.PlanoConflitoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.PlanoAlimentarRepository;
import com.nutri4you.backend.support.TestDataFactory;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.*;

@SpringBootTest(
        properties =
                "spring.datasource.url=jdbc:h2:mem:prescricao-concorrencia;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PrescricaoConcorrenciaTest {
    @Autowired PrescricaoService service;
    @Autowired NutricionistaRepository nutricionistas;
    @Autowired PacienteRepository pacientes;
    @Autowired ConsultaRepository consultas;
    @Autowired PlanoAlimentarRepository planos;
    @Autowired EntityManager em;
    @Autowired PasswordEncoder encoder;
    @Autowired PlatformTransactionManager transactionManager;

    @Test
    void publicacoesConcorrentesEntreAutoresNaoProduzemVigenciasSobrepostas() throws Exception {
        TransactionTemplate transacao = new TransactionTemplate(transactionManager);
        var contexto =
                transacao.execute(
                        status -> {
                            Nutricionista primeiro =
                                    nutricionistas.save(TestDataFactory.nutricionista(encoder));
                            Nutricionista segundo =
                                    nutricionistas.save(
                                            new Nutricionista(
                                                    "Outro",
                                                    "outro@nutri.com",
                                                    encoder.encode("senha123"),
                                                    "CRN-222"));
                            Paciente paciente =
                                    pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
                            consultas.save(TestDataFactory.consulta(paciente, primeiro));
                            consultas.save(TestDataFactory.consulta(paciente, segundo));
                            em.createNativeQuery(
                                            "insert into alimento"
                                                + " (id_alimento,nome,nome_busca,kcal_100g,proteina_100g,carboidratos_100g,gordura_100g,disponivel_prescricao,catalogo_ativo)"
                                                + " values"
                                                + " (3001,'Teste','teste',100,5,20,1,true,true)")
                                    .executeUpdate();
                            LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
                            PlanoRequest request =
                                    new PlanoRequest(
                                            "Plano",
                                            null,
                                            hoje,
                                            hoje.plusDays(10),
                                            null,
                                            null,
                                            List.of(
                                                    new RefeicaoRequest(
                                                            "Almoço",
                                                            LocalTime.NOON,
                                                            List.of(
                                                                    new ItemRequest(
                                                                            3001,
                                                                            new BigDecimal(
                                                                                    "100"))))));
                            PlanoDTO a = service.criar(primeiro, paciente.getId(), request);
                            PlanoDTO b = service.criar(segundo, paciente.getId(), request);
                            return new Contexto(primeiro, segundo, paciente.getId(), a, b);
                        });
        CountDownLatch inicio = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<String> a =
                    executor.submit(
                            () ->
                                    publicar(
                                            inicio,
                                            contexto.primeiro(),
                                            contexto.pacienteId(),
                                            contexto.a()));
            Future<String> b =
                    executor.submit(
                            () ->
                                    publicar(
                                            inicio,
                                            contexto.segundo(),
                                            contexto.pacienteId(),
                                            contexto.b()));
            inicio.countDown();
            assertThat(List.of(a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder("PUBLICADO", "CONFLITO");
        }
        Long publicados =
                transacao.execute(
                        status ->
                                planos
                                        .findByPaciente_IdOrderByIdDesc(contexto.pacienteId())
                                        .stream()
                                        .filter(p -> "PUBLICADO".equals(p.getStatus()))
                                        .count());
        assertThat(publicados).isEqualTo(1L);
    }

    private String publicar(
            CountDownLatch inicio, Nutricionista autor, Integer pacienteId, PlanoDTO plano)
            throws InterruptedException {
        inicio.await();
        try {
            service.publicar(autor, pacienteId, plano.id(), plano.versao());
            return "PUBLICADO";
        } catch (PlanoConflitoException conflito) {
            return "CONFLITO";
        }
    }

    private record Contexto(
            Nutricionista primeiro,
            Nutricionista segundo,
            Integer pacienteId,
            PlanoDTO a,
            PlanoDTO b) {}
}
