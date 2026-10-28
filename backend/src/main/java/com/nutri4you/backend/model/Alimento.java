package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Locale;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "Alimento")
public class Alimento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id_alimento")
    private Integer id;
    @Column(nullable = false, length = 150) private String nome;
    @Column(length = 100) private String categoria;
    @Column(name = "kcal_100g", precision = 6, scale = 2) private BigDecimal kcal;
    @Column(name = "proteina_100g", precision = 6, scale = 2) private BigDecimal proteina;
    @Column(name = "carboidratos_100g", precision = 6, scale = 2) private BigDecimal carboidratos;
    @Column(name = "gordura_100g", precision = 6, scale = 2) private BigDecimal gordura;
    @Column(name = "codigo_taco", unique = true) private Integer codigoTaco;
    @JsonIgnore @Column(name = "nome_busca", nullable = false, length = 150) private String nomeBusca;
    @JsonIgnore @Column(name = "disponivel_para_prescricao", nullable = false) private boolean disponivelParaPrescricao = true;
    @PrePersist @PreUpdate
    private void atualizarBusca() { nomeBusca = normalizarBusca(nome); }
    public static String normalizarBusca(String texto) {
        return Normalizer.normalize(texto.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replaceAll("[^a-z0-9]+", " ").trim();
    }
    protected Alimento() {}
    public Alimento(String nome, BigDecimal kcal, BigDecimal proteina, BigDecimal carboidratos, BigDecimal gordura) {
        this.nome = nome; this.kcal = kcal; this.proteina = proteina; this.carboidratos = carboidratos; this.gordura = gordura;
    }
    public Integer getId() { return id; }
    public String getNome() { return nome; }
    public String getCategoria() { return categoria; }
    public BigDecimal getKcal() { return kcal; }
    public BigDecimal getProteina() { return proteina; }
    public BigDecimal getCarboidratos() { return carboidratos; }
    public BigDecimal getGordura() { return gordura; }
    public Integer getCodigoTaco() { return codigoTaco; }
}
