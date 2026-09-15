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

@Entity
@Table(name = "Relacao_Clinica")
public class RelacaoClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_relacao")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_nutricionista", nullable = false)
    private Nutricionista nutricionista;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusRelacaoClinica status = StatusRelacaoClinica.ATIVA;

    @Column(name = "iniciada_em")
    private LocalDateTime iniciadaEm;

    @Column(name = "encerrada_em")
    private LocalDateTime encerradaEm;

    protected RelacaoClinica() {
    }

    public static RelacaoClinica criar(Paciente paciente, Nutricionista nutricionista) {
        RelacaoClinica relacao = new RelacaoClinica();
        relacao.paciente = paciente;
        relacao.nutricionista = nutricionista;
        relacao.status = StatusRelacaoClinica.ATIVA;
        relacao.iniciadaEm = LocalDateTime.now();
        return relacao;
    }

    public void reativar() {
        this.status = StatusRelacaoClinica.ATIVA;
        this.iniciadaEm = LocalDateTime.now();
        this.encerradaEm = null;
    }

    public void encerrar() {
        this.status = StatusRelacaoClinica.ENCERRADA;
        this.encerradaEm = LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public Nutricionista getNutricionista() {
        return nutricionista;
    }

    public StatusRelacaoClinica getStatus() {
        return status;
    }

    public LocalDateTime getIniciadaEm() {
        return iniciadaEm;
    }

    public LocalDateTime getEncerradaEm() {
        return encerradaEm;
    }
}
