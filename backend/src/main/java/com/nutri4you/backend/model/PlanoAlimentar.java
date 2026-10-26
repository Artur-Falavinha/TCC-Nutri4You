package com.nutri4you.backend.model;

import com.nutri4you.backend.dto.PrescricaoDTO.Nutrientes;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    @Column(nullable = false, length = 150)
    private String titulo = "Plano alimentar";

    @Column(length = 4000)
    private String orientacoes;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm = Instant.now();

    @Column(name = "revisado_em", nullable = false)
    private Instant revisadoEm = Instant.now();

    @Column(name = "publicado_em")
    private Instant publicadoEm;

    @OneToMany(mappedBy = "plano", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("horario, id")
    private List<Refeicao> refeicoes = new ArrayList<>();

    @OneToMany(mappedBy = "plano", cascade = CascadeType.REMOVE)
    private List<ListaCompras> listasCompras = new ArrayList<>();

    public PlanoAlimentar(Paciente paciente, Nutricionista nutricionista) {
        this.paciente = paciente;
        this.nutricionista = nutricionista;
    }

    public void editar(
            String titulo, String orientacoes, LocalDate inicio, LocalDate fim, Nutrientes metas) {
        this.revisadoEm = Instant.now();
        this.titulo = titulo;
        this.orientacoes = orientacoes;
        this.vigenciaInicio = inicio;
        this.vigenciaFim = fim;
        this.metaCalorias = metas == null ? null : metas.kcal();
        this.metaProteina = metas == null ? null : metas.proteinas();
        this.metaCarboidratos = metas == null ? null : metas.carboidratos();
        this.metaGordura = metas == null ? null : metas.gorduras();
    }

    public void publicar() {
        status = "PUBLICADO";
        publicadoEm = Instant.now();
    }

    public Long getVersao() {
        return versao;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getOrientacoes() {
        return orientacoes;
    }

    public Instant getPublicadoEm() {
        return publicadoEm;
    }

    public List<Refeicao> getRefeicoes() {
        return refeicoes;
    }

    protected PlanoAlimentar() {}

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
