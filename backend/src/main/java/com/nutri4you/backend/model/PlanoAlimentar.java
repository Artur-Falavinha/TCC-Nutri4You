package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Plano_Alimentar")
public class PlanoAlimentar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_plano")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_consulta", unique = true)
    private Consulta consulta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_nutricionista", nullable = false)
    private Nutricionista nutricionista;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "RASCUNHO";

    @Column(name = "vigencia_inicio")
    private LocalDate vigenciaInicio;

    @Column(name = "vigencia_fim")
    private LocalDate vigenciaFim;

    @Column(name = "vet_meta_kcal", precision = 8, scale = 2)
    private BigDecimal metaCalorias;

    @Column(name = "meta_carboidratos", precision = 8, scale = 2)
    private BigDecimal metaCarboidratos;

    @Column(name = "meta_gordura", precision = 8, scale = 2)
    private BigDecimal metaGordura;

    @Column(name = "meta_proteina", precision = 8, scale = 2)
    private BigDecimal metaProteina;

    protected PlanoAlimentar() {
    }

    public PlanoAlimentar(
            Consulta consulta,
            BigDecimal metaCalorias,
            BigDecimal metaCarboidratos,
            BigDecimal metaGordura,
            BigDecimal metaProteina) {
        this.consulta = consulta;
        this.paciente = consulta.getPaciente();
        this.nutricionista = consulta.getNutricionista();
        this.metaCalorias = metaCalorias;
        this.metaCarboidratos = metaCarboidratos;
        this.metaGordura = metaGordura;
        this.metaProteina = metaProteina;
    }

    public Integer getId() {
        return id;
    }

    public Consulta getConsulta() {
        return consulta;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public Nutricionista getNutricionista() {
        return nutricionista;
    }

    public String getStatus() {
        return status;
    }

    public LocalDate getVigenciaInicio() {
        return vigenciaInicio;
    }

    public LocalDate getVigenciaFim() {
        return vigenciaFim;
    }

    public BigDecimal getMetaCalorias() {
        return metaCalorias;
    }

    public BigDecimal getMetaCarboidratos() {
        return metaCarboidratos;
    }

    public BigDecimal getMetaGordura() {
        return metaGordura;
    }

    public BigDecimal getMetaProteina() {
        return metaProteina;
    }
}
