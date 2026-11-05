package com.nutri4you.backend.support;

import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;

/** Calls real services/repositories directly; each test rolls its data back. */
@SpringBootTest
@Transactional
public abstract class ClinicalServiceTestSupport {
    @Autowired protected NutricionistaRepository nutricionistas;
    @Autowired protected PacienteRepository pacientes;
    @Autowired protected ConsultaRepository consultas;
    @Autowired protected PlanoAlimentarRepository planos;
    @Autowired protected RelacaoClinicaRepository relacoes;
    @Autowired protected AlimentoRepository alimentos;
    @Autowired protected PasswordEncoder encoder;
    protected Nutricionista nutri;
    protected Paciente paciente;

    @BeforeEach void dadosClinicos() {
        nutri = nutricionistas.save(TestDataFactory.nutricionista(encoder));
        paciente = pacientes.save(TestDataFactory.pacienteConfirmado(encoder));
        relacoes.save(RelacaoClinica.criar(paciente, nutri));
    }
    protected LocalDate hoje() { return LocalDate.now(ZoneId.of("America/Sao_Paulo")); }
    protected LocalDateTime agora() { return LocalDateTime.now(ZoneId.of("America/Sao_Paulo")).withNano(0); }
    protected PlanoAlimentar rascunho(LocalDate inicio, LocalDate fim) {
        PlanoAlimentar plano = new PlanoAlimentar(paciente, nutri);
        plano.editar(null, inicio, fim, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
        return planos.saveAndFlush(plano);
    }
    protected Consulta consulta(LocalDateTime inicio, String status) {
        Consulta consulta = new Consulta(paciente, nutri, inicio);
        consulta.atualizar(inicio, status, null);
        return consultas.saveAndFlush(consulta);
    }
}
