package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Duration;
import java.time.Instant;

@Entity
@Table(name = "cadastro_pendente")
public class CadastroPendente {

    @Id
    @Column(length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_usuario", nullable = false, length = 20)
    private TipoCadastro tipoUsuario;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "enviado_em", nullable = false)
    private Instant enviadoEm;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(nullable = false)
    private boolean confirmado;

    protected CadastroPendente() {
    }

    public CadastroPendente(String email) {
        this.email = email;
    }

    public void prepararEnvio(TipoCadastro tipo, String hash, Instant agora, Instant validade) {
        tipoUsuario = tipo;
        tokenHash = hash;
        enviadoEm = agora;
        expiraEm = validade;
        confirmado = false;
    }

    public boolean podeEnviar(Instant agora, Duration intervalo) {
        return expirou(agora) || (!confirmado && !enviadoEm.plus(intervalo).isAfter(agora));
    }

    public boolean expirou(Instant agora) {
        return !expiraEm.isAfter(agora);
    }

    public void confirmar(Instant agora, Duration prazoConclusao) {
        if (!confirmado) {
            confirmado = true;
            expiraEm = agora.plus(prazoConclusao);
        }
    }

    public String getEmail() {
        return email;
    }

    public TipoCadastro getTipoUsuario() {
        return tipoUsuario;
    }

    public Instant getExpiraEm() {
        return expiraEm;
    }

    public boolean isConfirmado() {
        return confirmado;
    }
}
