package com.nutri4you.backend.service;

import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
class ContasEmail {
    private final JdbcTemplate jdbc;
    private final PacienteRepository pacientes;
    private final NutricionistaRepository nutricionistas;

    ContasEmail(JdbcTemplate jdbc, PacienteRepository pacientes, NutricionistaRepository nutricionistas) {
        this.jdbc = jdbc;
        this.pacientes = pacientes;
        this.nutricionistas = nutricionistas;
    }

    void bloquearEscritas() {
        jdbc.queryForObject("select id from bloqueio_email_conta where id = 1 for update", Integer.class);
    }

    boolean emUso(String email) {
        return nutricionistas.findByEmailIgnoreCase(email).isPresent()
                || pacientes.findByEmailIgnoreCase(email).isPresent();
    }

    static String normalizar(String endereco) {
        if (endereco == null || endereco.isBlank()) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }
        String normalizado = endereco.trim().toLowerCase(Locale.ROOT);
        try {
            InternetAddress email = new InternetAddress(normalizado, true);
            email.validate();
            if (!email.isGroup() && normalizado.equals(email.getAddress()) && normalizado.length() <= 100) {
                return normalizado;
            }
        } catch (AddressException exception) {
            throw new IllegalArgumentException("Informe um e-mail válido.", exception);
        }
        throw new IllegalArgumentException("Informe um e-mail válido.");
    }
}
