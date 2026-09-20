package com.nutri4you.backend.support;

import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

public final class TestDataFactory {

    private TestDataFactory() {
    }

    public static Nutricionista nutricionista(PasswordEncoder encoder) {
        return new Nutricionista(
                "Nutricionista Teste",
                "nutri@teste.com",
                encoder.encode("senha123"),
                "CRN8-99999");
    }

    public static Paciente pacienteConfirmado(PasswordEncoder encoder) {
        Paciente paciente = new Paciente(
                "Paciente Teste",
                "123.456.789-00",
                null,
                "Masculino",
                "41999990000",
                "paciente@teste.com",
                encoder.encode("senha123"));
        paciente.setEmailConfirmado(true);
        return paciente;
    }

    public static Paciente outroPaciente(PasswordEncoder encoder) {
        Paciente paciente = new Paciente(
                "Outro Paciente",
                "987.654.321-00",
                null,
                "Feminino",
                "41988880000",
                "outro@teste.com",
                encoder.encode("senha123"));
        paciente.setEmailConfirmado(true);
        return paciente;
    }

    public static Consulta consulta(Paciente paciente, Nutricionista nutricionista) {
        return new Consulta(paciente, nutricionista, LocalDateTime.now());
    }
}
