package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "notificacao_plano_alimentar")
public class NotificacaoPlanoAlimentar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_paciente", nullable = false)
    private Integer pacienteId;

    @Column(name = "id_plano", nullable = false, unique = true)
    private Integer planoId;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false)
    private boolean atualizacao;

    @Column(name = "edicao_agendada", nullable = false)
    private boolean edicaoAgendada;

    @Column(nullable = false)
    private LocalDate vigenciaInicio;

    @Column(nullable = false)
    private LocalDate vigenciaFim;

    @Column(nullable = false)
    private Instant criadaEm;

    protected NotificacaoPlanoAlimentar() {
    }

    public NotificacaoPlanoAlimentar(PlanoAlimentar plano, boolean atualizacao) {
        this.pacienteId = plano.getPaciente().getId();
        this.planoId = plano.getId();
        this.titulo = plano.getTitulo();
        this.atualizacao = atualizacao;
        this.edicaoAgendada = plano.getPlanoAnterior() != null;
        this.vigenciaInicio = plano.getVigenciaInicio();
        this.vigenciaFim = plano.getVigenciaFim();
        this.criadaEm = plano.getPublicadoEm();
    }

    public Long getId() { return id; }
    public String getTitulo() { return titulo; }
    public boolean isAtualizacao() { return atualizacao; }
    public boolean isEdicaoAgendada() { return edicaoAgendada; }
    public LocalDate getVigenciaInicio() { return vigenciaInicio; }
    public LocalDate getVigenciaFim() { return vigenciaFim; }
    public Instant getCriadaEm() { return criadaEm; }
}
