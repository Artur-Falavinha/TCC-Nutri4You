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

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Consumo_Diario")
public class ConsumoDiario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_consumo")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @Column(name = "data_registro", nullable = false)
    private LocalDate dataRegistro;

    @Column(name = "kcal_consumidas", precision = 6, scale = 2)
    private BigDecimal kcalConsumidas = BigDecimal.ZERO;

    @Column(name = "agua_ml_consumida")
    private Integer aguaMlConsumida = 0;

    protected ConsumoDiario() {
    }

    public ConsumoDiario(Paciente paciente, LocalDate dataRegistro, BigDecimal kcalConsumidas, Integer aguaMlConsumida) {
        this.paciente = paciente;
        this.dataRegistro = dataRegistro;
        this.kcalConsumidas = kcalConsumidas != null ? kcalConsumidas : BigDecimal.ZERO;
        this.aguaMlConsumida = aguaMlConsumida != null ? aguaMlConsumida : 0;
    }

    public Integer getId() {
        return id;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public LocalDate getDataRegistro() {
        return dataRegistro;
    }

    public BigDecimal getKcalConsumidas() {
        return kcalConsumidas;
    }

    public Integer getAguaMlConsumida() {
        return aguaMlConsumida;
    }
}

