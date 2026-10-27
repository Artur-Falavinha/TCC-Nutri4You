package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm = Instant.now();
    @Column(name = "publicado_em")
    private Instant publicadoEm;
    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm = Instant.now();
    @Version
    @Column(nullable = false)
    private long versao;
    @OneToMany(mappedBy = "plano", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("diaSemana ASC, horario ASC, id ASC")
    private List<Refeicao> refeicoes = new ArrayList<>();

    public PlanoAlimentar(Paciente paciente, Nutricionista nutricionista) {
        this.paciente = paciente; this.nutricionista = nutricionista;
    }
    public void editar(Consulta consulta, LocalDate inicio, LocalDate fim, BigDecimal kcal,
                       BigDecimal carboidratos, BigDecimal gordura, BigDecimal proteina) {
        this.consulta = consulta; this.vigenciaInicio = inicio; this.vigenciaFim = fim;
        this.metaCalorias = kcal; this.metaCarboidratos = carboidratos;
        this.metaGordura = gordura; this.metaProteina = proteina; tocar();
    }
    public void publicar() { status = "PUBLICADO"; publicadoEm = Instant.now(); tocar(); }
    public void terminarEm(LocalDate data) { vigenciaFim = data; tocar(); }
    public void substituir() { status = "SUBSTITUIDO"; tocar(); }
    public void tocar() { atualizadoEm = Instant.now(); }
    public BigDecimal getMetaKcal() { return metaCalorias; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getPublicadoEm() { return publicadoEm; }
    public long getVersao() { return versao; }
    public List<Refeicao> getRefeicoes() { return refeicoes; }

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
