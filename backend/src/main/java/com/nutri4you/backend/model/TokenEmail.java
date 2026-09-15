package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "Token_Email")
public class TokenEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_token")
    private Integer id;

    @Column(nullable = false, unique = true)
    private UUID token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoTokenEmail tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "usado_em")
    private LocalDateTime usadoEm;

    protected TokenEmail() {
    }

    public static TokenEmail criar(Paciente paciente, TipoTokenEmail tipo, LocalDateTime expiraEm) {
        TokenEmail tokenEmail = new TokenEmail();
        tokenEmail.token = UUID.randomUUID();
        tokenEmail.paciente = paciente;
        tokenEmail.tipo = tipo;
        tokenEmail.expiraEm = expiraEm;
        return tokenEmail;
    }

    public void marcarComoUsado() {
        this.usadoEm = LocalDateTime.now();
    }

    public boolean isExpirado() {
        return LocalDateTime.now().isAfter(expiraEm);
    }

    public boolean isUsado() {
        return usadoEm != null;
    }

    public Integer getId() {
        return id;
    }

    public UUID getToken() {
        return token;
    }

    public TipoTokenEmail getTipo() {
        return tipo;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public LocalDateTime getExpiraEm() {
        return expiraEm;
    }

    public LocalDateTime getUsadoEm() {
        return usadoEm;
    }
}
