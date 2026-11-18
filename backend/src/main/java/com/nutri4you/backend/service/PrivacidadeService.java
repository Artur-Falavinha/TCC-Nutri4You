package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;

@Service
public class PrivacidadeService {
    public static final String VERSAO = "2026-11-16.2";
    private final JdbcTemplate jdbc;

    public PrivacidadeService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private record Titular(String tipo, Integer id) {}

    public static void exigirVersao(String versao) {
        if (!VERSAO.equals(versao)) throw new IllegalArgumentException("Leia e aceite a versão atual dos termos de uso.");
    }

    @Transactional
    public void aceitar(Object principal, String versao) {
        exigirVersao(versao);
        Titular titular = titular(principal);
        bloquearTitular(titular);
        // A chave do aceite preserva a primeira data para cada versão publicada.
        if (aceitou(principal)) return;
        jdbc.update("""
                insert into aceite_termo(tipo, titular_id, versao, aceito_em)
                values (?, ?, ?, ?)
                """, titular.tipo(), titular.id(), versao, Timestamp.from(Instant.now()));
    }

    public boolean aceitou(Object principal) {
        return dataAceite(principal) != null;
    }

    public Instant dataAceite(Object principal) {
        Titular titular = titular(principal);
        return jdbc.query("""
                select aceito_em from aceite_termo where tipo = ? and titular_id = ? and versao = ?
                """, rs -> rs.next() ? rs.getTimestamp("aceito_em").toInstant() : null,
                titular.tipo(), titular.id(), VERSAO);
    }

    private Titular titular(Object principal) {
        if (principal instanceof Paciente paciente) return new Titular("PACIENTE", paciente.getId());
        if (principal instanceof Nutricionista nutricionista) return new Titular("NUTRICIONISTA", nutricionista.getId());
        throw new AcessoNegadoException("Acesso restrito à sua conta.");
    }

    private void bloquearTitular(Titular titular) {
        String consulta = titular.tipo().equals("PACIENTE")
                ? "select id_paciente from paciente where id_paciente = ? for update"
                : "select id_nutricionista from nutricionista where id_nutricionista = ? for update";
        jdbc.queryForObject(consulta, Integer.class, titular.id());
    }
}
