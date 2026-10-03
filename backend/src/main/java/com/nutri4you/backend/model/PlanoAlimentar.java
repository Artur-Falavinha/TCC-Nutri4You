package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "Plano_Alimentar")
public class PlanoAlimentar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_plano")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paciente", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_nutricionista", nullable = false)
    private Nutricionista nutricionista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_consulta", unique = true)
    private Consulta consulta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusPlanoAlimentar status = StatusPlanoAlimentar.RASCUNHO;

    @Column(name = "vigencia_inicio")
    private LocalDate vigenciaInicio;

    @Column(name = "vigencia_fim")
    private LocalDate vigenciaFim;

    @Column(name = "vet_meta_kcal", precision = 6, scale = 2)
    private BigDecimal metaKcal;

    @Column(name = "meta_carboidratos", precision = 6, scale = 2)
    private BigDecimal metaCarboidratos;

    @Column(name = "meta_gordura", precision = 6, scale = 2)
    private BigDecimal metaGordura;

    @Column(name = "meta_proteina", precision = 6, scale = 2)
    private BigDecimal metaProteina;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm = Instant.now();

    @Column(name = "publicado_em")
    private Instant publicadoEm;

    @Version
    @Column(nullable = false)
    private long versao;

    protected PlanoAlimentar() {}

    public PlanoAlimentar(Paciente paciente, Nutricionista nutricionista) {
        this.paciente = paciente;
        this.nutricionista = nutricionista;
    }

    public void editar(Consulta consulta, LocalDate inicio, LocalDate fim, BigDecimal kcal,
                       BigDecimal carboidratos, BigDecimal gordura, BigDecimal proteina) {
        this.consulta = consulta;
        this.vigenciaInicio = inicio;
        this.vigenciaFim = fim;
        this.metaKcal = kcal;
        this.metaCarboidratos = carboidratos;
        this.metaGordura = gordura;
        this.metaProteina = proteina;
    }

    public void publicar() {
        this.status = StatusPlanoAlimentar.PUBLICADO;
        this.publicadoEm = Instant.now();
    }

    public void terminarEm(LocalDate data) { this.vigenciaFim = data; }
    public void substituir() { this.status = StatusPlanoAlimentar.SUBSTITUIDO; }

    public Integer getId() { return id; }
    public Paciente getPaciente() { return paciente; }
    public Nutricionista getNutricionista() { return nutricionista; }
    public Consulta getConsulta() { return consulta; }
    public StatusPlanoAlimentar getStatus() { return status; }
    public LocalDate getVigenciaInicio() { return vigenciaInicio; }
    public LocalDate getVigenciaFim() { return vigenciaFim; }
    public BigDecimal getMetaKcal() { return metaKcal; }
    public BigDecimal getMetaCarboidratos() { return metaCarboidratos; }
    public BigDecimal getMetaGordura() { return metaGordura; }
    public BigDecimal getMetaProteina() { return metaProteina; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getPublicadoEm() { return publicadoEm; }
    public long getVersao() { return versao; }
}
