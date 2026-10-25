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
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "Plano_Alimentar")
public class PlanoAlimentar {

    public static final String STATUS_RASCUNHO = "RASCUNHO";
    public static final String STATUS_PUBLICADO = "PUBLICADO";
    public static final String STATUS_SUBSTITUIDO = "SUBSTITUIDO";

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

    @Column(name = "titulo", nullable = false, length = 100)
    private String titulo = "Plano alimentar";

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_RASCUNHO;

    @Column(name = "vigencia_inicio")
    private LocalDate vigenciaInicio;

    @Column(name = "vigencia_fim")
    private LocalDate vigenciaFim;

    @Column(name = "vet_meta_kcal", precision = 8, scale = 2)
    private BigDecimal metaCalorias = BigDecimal.ZERO;

    @Column(name = "meta_carboidratos", precision = 8, scale = 2)
    private BigDecimal metaCarboidratos = BigDecimal.ZERO;

    @Column(name = "meta_gordura", precision = 8, scale = 2)
    private BigDecimal metaGordura = BigDecimal.ZERO;

    @Column(name = "meta_proteina", precision = 8, scale = 2)
    private BigDecimal metaProteina = BigDecimal.ZERO;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now(ZoneOffset.UTC);

    @Column(name = "publicado_em")
    private OffsetDateTime publicadoEm;

    @Version
    @Column(name = "versao", nullable = false)
    private Long versao = 0L;

    protected PlanoAlimentar() {
    }

    public PlanoAlimentar(Paciente paciente, Nutricionista nutricionista) {
        this.paciente = paciente;
        this.nutricionista = nutricionista;
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

    public void setConsulta(Consulta consulta) {
        this.consulta = consulta;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public Nutricionista getNutricionista() {
        return nutricionista;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = (titulo == null || titulo.isBlank()) ? "Plano alimentar" : titulo.trim();
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getVigenciaInicio() {
        return vigenciaInicio;
    }

    public void setVigenciaInicio(LocalDate vigenciaInicio) {
        this.vigenciaInicio = vigenciaInicio;
    }

    public LocalDate getVigenciaFim() {
        return vigenciaFim;
    }

    public void setVigenciaFim(LocalDate vigenciaFim) {
        this.vigenciaFim = vigenciaFim;
    }

    public BigDecimal getMetaCalorias() {
        return metaCalorias;
    }

    public void setMetaCalorias(BigDecimal metaCalorias) {
        this.metaCalorias = metaCalorias;
    }

    public BigDecimal getMetaCarboidratos() {
        return metaCarboidratos;
    }

    public void setMetaCarboidratos(BigDecimal metaCarboidratos) {
        this.metaCarboidratos = metaCarboidratos;
    }

    public BigDecimal getMetaGordura() {
        return metaGordura;
    }

    public void setMetaGordura(BigDecimal metaGordura) {
        this.metaGordura = metaGordura;
    }

    public BigDecimal getMetaProteina() {
        return metaProteina;
    }

    public void setMetaProteina(BigDecimal metaProteina) {
        this.metaProteina = metaProteina;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getPublicadoEm() {
        return publicadoEm;
    }

    public void setPublicadoEm(OffsetDateTime publicadoEm) {
        this.publicadoEm = publicadoEm;
    }

    public Long getVersao() {
        return versao;
    }

    public void publicar(OffsetDateTime instantePublicacao, LocalDate dataPadraoVigencia) {
        this.status = STATUS_PUBLICADO;
        this.publicadoEm = instantePublicacao;
        if (this.vigenciaInicio == null) {
            this.vigenciaInicio = dataPadraoVigencia;
        }
    }

    public void substituir(LocalDate dataEncerramento) {
        this.status = STATUS_SUBSTITUIDO;
        if (this.vigenciaFim == null || (dataEncerramento != null && this.vigenciaFim.isAfter(dataEncerramento))) {
            this.vigenciaFim = dataEncerramento;
        }
    }
}
