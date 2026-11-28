package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PrivacidadeService {
    public static final String VERSAO = "2026-11-22";
    private final JdbcTemplate jdbc;

    public PrivacidadeService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    private record Titular(String tipo, Integer id) {}
    public record Aceite(String versao, Instant aceitoEm) {}

    public static void exigirVersao(String versao) {
        if (!VERSAO.equals(versao)) throw new IllegalArgumentException("Leia e aceite a versão atual dos termos de uso.");
    }

    @Transactional
    public void aceitar(Object principal, String versao) {
        exigirVersao(versao);
        Titular titular = titular(principal);
        jdbc.update("""
                insert into aceite_termo(tipo, titular_id, versao, aceito_em)
                values (?, ?, ?, current_timestamp)
                on conflict do nothing
                """, titular.tipo(), titular.id(), versao);
    }

    @Transactional
    public void reaceitar(Object principal, String versao) {
        exigirVersao(versao);
        Titular titular = titular(principal);
        int atualizados = jdbc.update("""
                update aceite_termo set aceito_em = current_timestamp
                where tipo = ? and titular_id = ? and versao = ?
                """, titular.tipo(), titular.id(), versao);
        if (atualizados == 0) {
            aceitar(principal, versao);
        }
    }

    public boolean aceitou(Object principal) {
        Titular titular = titular(principal);
        return Boolean.TRUE.equals(jdbc.query("""
                select 1 from aceite_termo where tipo = ? and titular_id = ? fetch first 1 row only
                """, registros -> {
                    return registros.next();
                }, titular.tipo(), titular.id()));
    }

    public Aceite consultarAceite(Object principal) {
        Titular titular = titular(principal);
        return jdbc.query("""
                select versao, aceito_em from aceite_termo where tipo = ? and titular_id = ?
                order by aceito_em desc, versao desc fetch first 1 row only
                """, registros -> registros.next()
                ? new Aceite(registros.getString("versao"), registros.getTimestamp("aceito_em").toInstant()) : null,
                titular.tipo(), titular.id());
    }

    private Titular titular(Object principal) {
        if (principal instanceof Paciente paciente) return new Titular("PACIENTE", paciente.getId());
        if (principal instanceof Nutricionista nutricionista) return new Titular("NUTRICIONISTA", nutricionista.getId());
        throw new AcessoNegadoException("Acesso restrito à sua conta.");
    }
}
