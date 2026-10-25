package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "Alimento")
public class Alimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_alimento")
    private Integer id;

    @Column(name = "numero_taco", unique = true)
    private Integer numeroTaco;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "categoria", length = 100)
    private String categoria;

    @Column(name = "kcal_100g", precision = 6, scale = 2)
    private BigDecimal kcal100g = BigDecimal.ZERO;

    @Column(name = "proteina_100g", precision = 6, scale = 2)
    private BigDecimal proteina100g = BigDecimal.ZERO;

    @Column(name = "carboidratos_100g", precision = 6, scale = 2)
    private BigDecimal carboidratos100g = BigDecimal.ZERO;

    @Column(name = "gordura_100g", precision = 6, scale = 2)
    private BigDecimal gordura100g = BigDecimal.ZERO;

    @Column(name = "fibra_100g", precision = 6, scale = 2)
    private BigDecimal fibra100g = BigDecimal.ZERO;

    protected Alimento() {
    }

    public Alimento(
            Integer numeroTaco,
            String nome,
            String categoria,
            BigDecimal kcal100g,
            BigDecimal proteina100g,
            BigDecimal carboidratos100g,
            BigDecimal gordura100g,
            BigDecimal fibra100g) {
        this.numeroTaco = numeroTaco;
        this.nome = nome;
        this.categoria = categoria;
        this.kcal100g = kcal100g == null ? BigDecimal.ZERO : kcal100g;
        this.proteina100g = proteina100g == null ? BigDecimal.ZERO : proteina100g;
        this.carboidratos100g = carboidratos100g == null ? BigDecimal.ZERO : carboidratos100g;
        this.gordura100g = gordura100g == null ? BigDecimal.ZERO : gordura100g;
        this.fibra100g = fibra100g == null ? BigDecimal.ZERO : fibra100g;
    }

    public Integer getId() {
        return id;
    }

    public Integer getNumeroTaco() {
        return numeroTaco;
    }

    public void setNumeroTaco(Integer numeroTaco) {
        this.numeroTaco = numeroTaco;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getKcal100g() {
        return kcal100g;
    }

    public void setKcal100g(BigDecimal kcal100g) {
        this.kcal100g = kcal100g;
    }

    public BigDecimal getProteina100g() {
        return proteina100g;
    }

    public void setProteina100g(BigDecimal proteina100g) {
        this.proteina100g = proteina100g;
    }

    public BigDecimal getCarboidratos100g() {
        return carboidratos100g;
    }

    public void setCarboidratos100g(BigDecimal carboidratos100g) {
        this.carboidratos100g = carboidratos100g;
    }

    public BigDecimal getGordura100g() {
        return gordura100g;
    }

    public void setGordura100g(BigDecimal gordura100g) {
        this.gordura100g = gordura100g;
    }

    public BigDecimal getFibra100g() {
        return fibra100g;
    }

    public void setFibra100g(BigDecimal fibra100g) {
        this.fibra100g = fibra100g;
    }
}

