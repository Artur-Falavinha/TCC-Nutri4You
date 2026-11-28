package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificacao_consulta_paciente")
public class NotificacaoConsultaPaciente {
    public enum Tipo { CONFIRMADA, REAGENDADA, RECUSADA, CANCELADA, LEMBRETE_24H }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_paciente", nullable = false)
    private Integer pacienteId;

    @Column(name = "id_consulta", nullable = false)
    private Integer consultaId;

    @Column(nullable = false)
    private long versaoConsulta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Tipo tipo;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    @Column(nullable = false)
    private Instant criadaEm;

    protected NotificacaoConsultaPaciente() {
    }

    public NotificacaoConsultaPaciente(Consulta consulta, Tipo tipo, Instant criadaEm) {
        this.pacienteId = consulta.getPaciente().getId();
        this.consultaId = consulta.getId();
        this.versaoConsulta = consulta.getVersao();
        this.tipo = tipo;
        this.dataHora = consulta.getDataHora();
        this.criadaEm = criadaEm;
    }

    public Long getId() { return id; }
    public Integer getConsultaId() { return consultaId; }
    public Tipo getTipo() { return tipo; }
    public LocalDateTime getDataHora() { return dataHora; }
    public Instant getCriadaEm() { return criadaEm; }
}
