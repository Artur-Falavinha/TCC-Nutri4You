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
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "Consumo_Diario",
        uniqueConstraints = @UniqueConstraint(
                name = "unq_consumo_diario",
                columnNames = {"id_paciente", "data_registro"}))
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

    @Column(name = "kcal_consumidas", precision = 8, scale = 2)
    private BigDecimal kcalConsumidas = BigDecimal.ZERO;

    @Column(name = "proteinas_consumidas", precision = 8, scale = 2)
    private BigDecimal proteinasConsumidas = BigDecimal.ZERO;

    @Column(name = "carboidratos_consumidos", precision = 8, scale = 2)
    private BigDecimal carboidratosConsumidos = BigDecimal.ZERO;

    @Column(name = "gorduras_consumidas", precision = 8, scale = 2)
    private BigDecimal gordurasConsumidas = BigDecimal.ZERO;
    @Column(name = "agua_ml_consumida")
    private Integer aguaMlConsumida = 0;

    protected ConsumoDiario() {
    }

    public ConsumoDiario(Paciente paciente, LocalDate dataRegistro, BigDecimal kcalConsumidas, Integer aguaMlConsumida) {
        this(paciente, dataRegistro, kcalConsumidas, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, aguaMlConsumida);
    }

    public ConsumoDiario(
            Paciente paciente,
            LocalDate dataRegistro,
            BigDecimal kcalConsumidas,
            BigDecimal proteinasConsumidas,
            BigDecimal carboidratosConsumidos,
            BigDecimal gordurasConsumidas,
            Integer aguaMlConsumida) {
        this.paciente = paciente;
        this.dataRegistro = dataRegistro;
        this.kcalConsumidas = zeroSeNulo(kcalConsumidas);
        this.proteinasConsumidas = zeroSeNulo(proteinasConsumidas);
        this.carboidratosConsumidos = zeroSeNulo(carboidratosConsumidos);
        this.gordurasConsumidas = zeroSeNulo(gordurasConsumidas);
        this.aguaMlConsumida = aguaMlConsumida != null ? aguaMlConsumida : 0;
    }

    private static BigDecimal zeroSeNulo(BigDecimal valor) {
        return valor != null ? valor : BigDecimal.ZERO;
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

    public BigDecimal getProteinasConsumidas() {
        return proteinasConsumidas;
    }

    public BigDecimal getCarboidratosConsumidos() {
        return carboidratosConsumidos;
    }

    public BigDecimal getGordurasConsumidas() {
        return gordurasConsumidas;
    }
    public Integer getAguaMlConsumida() {
        return aguaMlConsumida;
    }
}
