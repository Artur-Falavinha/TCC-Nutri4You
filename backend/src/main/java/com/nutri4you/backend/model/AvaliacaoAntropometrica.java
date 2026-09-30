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
import java.time.LocalDateTime;

@Entity
@Table(name = "Avaliacao_Antropometrica")
public class AvaliacaoAntropometrica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_avaliacao")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_consulta")
    private Consulta consulta;

    @Column(name = "data_avaliacao", nullable = false)
    private LocalDateTime dataAvaliacao;

    @Column(precision = 5, scale = 2)
    private BigDecimal peso;

    @Column(precision = 3, scale = 2)
    private BigDecimal altura;

    @Column(precision = 5, scale = 2)
    private BigDecimal imc;

    @Column(name = "percentual_gordura", precision = 5, scale = 2)
    private BigDecimal percentualGordura;

    @Column(name = "massa_muscular_kg", precision = 5, scale = 2)
    private BigDecimal massaMuscularKg;

    @Column(name = "prega_bicipital", precision = 5, scale = 2)
    private BigDecimal pregaBicipital;

    @Column(name = "prega_tricipital", precision = 5, scale = 2)
    private BigDecimal pregaTricipital;

    @Column(name = "prega_subescapular", precision = 5, scale = 2)
    private BigDecimal pregaSubescapular;

    @Column(name = "prega_suprailiaca", precision = 5, scale = 2)
    private BigDecimal pregaSuprailiaca;

    @Column(name = "circunferencia_cintura", precision = 5, scale = 2)
    private BigDecimal circunferenciaCintura;

    @Column(name = "circunferencia_quadril", precision = 5, scale = 2)
    private BigDecimal circunferenciaQuadril;

    @Column(name = "circunferencia_braco", precision = 5, scale = 2)
    private BigDecimal circunferenciaBraco;

    protected AvaliacaoAntropometrica() {
    }

    public AvaliacaoAntropometrica(Paciente paciente, LocalDateTime dataAvaliacao) {
        this.paciente = paciente;
        this.dataAvaliacao = dataAvaliacao;
    }

    public Integer getId() {
        return id;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public LocalDateTime getDataAvaliacao() {
        return dataAvaliacao;
    }

    public BigDecimal getPeso() {
        return peso;
    }

    public void setPeso(BigDecimal peso) {
        this.peso = peso;
    }

    public BigDecimal getAltura() {
        return altura;
    }

    public void setAltura(BigDecimal altura) {
        this.altura = altura;
    }

    public BigDecimal getImc() {
        return imc;
    }

    public void setImc(BigDecimal imc) {
        this.imc = imc;
    }

    public BigDecimal getPercentualGordura() {
        return percentualGordura;
    }

    public void setPercentualGordura(BigDecimal percentualGordura) {
        this.percentualGordura = percentualGordura;
    }

    public BigDecimal getMassaMuscularKg() {
        return massaMuscularKg;
    }

    public void setMassaMuscularKg(BigDecimal massaMuscularKg) {
        this.massaMuscularKg = massaMuscularKg;
    }

    public BigDecimal getPregaBicipital() {
        return pregaBicipital;
    }

    public void setPregaBicipital(BigDecimal pregaBicipital) {
        this.pregaBicipital = pregaBicipital;
    }

    public BigDecimal getPregaTricipital() {
        return pregaTricipital;
    }

    public void setPregaTricipital(BigDecimal pregaTricipital) {
        this.pregaTricipital = pregaTricipital;
    }

    public BigDecimal getPregaSubescapular() {
        return pregaSubescapular;
    }

    public void setPregaSubescapular(BigDecimal pregaSubescapular) {
        this.pregaSubescapular = pregaSubescapular;
    }

    public BigDecimal getPregaSuprailiaca() {
        return pregaSuprailiaca;
    }

    public void setPregaSuprailiaca(BigDecimal pregaSuprailiaca) {
        this.pregaSuprailiaca = pregaSuprailiaca;
    }

    public BigDecimal getCircunferenciaCintura() {
        return circunferenciaCintura;
    }

    public void setCircunferenciaCintura(BigDecimal circunferenciaCintura) {
        this.circunferenciaCintura = circunferenciaCintura;
    }

    public BigDecimal getCircunferenciaQuadril() {
        return circunferenciaQuadril;
    }

    public void setCircunferenciaQuadril(BigDecimal circunferenciaQuadril) {
        this.circunferenciaQuadril = circunferenciaQuadril;
    }

    public BigDecimal getCircunferenciaBraco() {
        return circunferenciaBraco;
    }

    public void setCircunferenciaBraco(BigDecimal circunferenciaBraco) {
        this.circunferenciaBraco = circunferenciaBraco;
    }
}
