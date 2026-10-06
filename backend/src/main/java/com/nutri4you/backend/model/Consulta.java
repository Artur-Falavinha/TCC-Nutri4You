package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "Consulta")
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_consulta")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_nutricionista", nullable = false)
    private Nutricionista nutricionista;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "observacao", columnDefinition = "text")
    private String observacao;

    @Version
    @Column(name = "versao", nullable = false)
    private long versao;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm = Instant.now();

    protected Consulta() {
    }

    public Consulta(Paciente paciente, Nutricionista nutricionista, LocalDateTime dataHora) {
        this.paciente = paciente;
        this.nutricionista = nutricionista;
        this.dataHora = dataHora;
        this.status = "AGUARDANDO_CONFIRMACAO";
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

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public String getStatus() {
        return status;
    }

    public void cancelar() {
        this.status = "CANCELADA";
    }

    public String getObservacao() { return observacao; }

    public long getVersao() { return versao; }

    public void atualizar(LocalDateTime dataHora, String status, String observacao) {
        this.dataHora = dataHora;
        this.status = status;
        this.observacao = observacao;
        // Medidas pertencem ao mesmo registro: sua edicao tambem invalida a versao anterior.
        this.atualizadoEm = Instant.now();
    }
}
