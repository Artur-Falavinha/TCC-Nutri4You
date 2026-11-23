package com.nutri4you.backend.repository;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class FotoPerfilRepository {
    public enum TipoTitular {
        PACIENTE("paciente_id"),
        NUTRICIONISTA("nutricionista_id");

        private final String coluna;

        TipoTitular(String coluna) {
            this.coluna = coluna;
        }
    }

    private final JdbcClient jdbc;

    public FotoPerfilRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<byte[]> buscar(TipoTitular tipo, int id) {
        return jdbc.sql("SELECT arquivo FROM foto_perfil WHERE %s = :id".formatted(tipo.coluna))
                .param("id", id)
                .query((resultado, linha) -> resultado.getBytes("arquivo"))
                .optional();
    }

    public void salvar(TipoTitular tipo, int id, byte[] arquivo) {
        jdbc.sql("""
                INSERT INTO foto_perfil (%1$s, arquivo) VALUES (:id, :arquivo)
                ON CONFLICT (%1$s) DO UPDATE SET arquivo = EXCLUDED.arquivo
                """.formatted(tipo.coluna))
                .param("id", id)
                .param("arquivo", arquivo)
                .update();
    }

    public void remover(TipoTitular tipo, int id) {
        jdbc.sql("DELETE FROM foto_perfil WHERE %s = :id".formatted(tipo.coluna))
                .param("id", id)
                .update();
    }
}
