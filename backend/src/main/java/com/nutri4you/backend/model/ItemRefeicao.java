package com.nutri4you.backend.model;

import com.nutri4you.backend.dto.PrescricaoDTO.Nutrientes;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Item_Refeicao")
@IdClass(ItemRefeicaoId.class)
public class ItemRefeicao {
    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_refeicao")
    private Refeicao refeicao;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_alimento")
    private Alimento alimento;

    @Column(name = "quantidade_gramas", nullable = false, precision = 8, scale = 2)
    private BigDecimal quantidadeGramas;

    @Column(name = "kcal_100g", precision = 12, scale = 6)
    private BigDecimal kcal100g;

    @Column(name = "proteina_100g", precision = 12, scale = 6)
    private BigDecimal proteina100g;

    @Column(name = "carboidratos_100g", precision = 12, scale = 6)
    private BigDecimal carboidratos100g;

    @Column(name = "gordura_100g", precision = 12, scale = 6)
    private BigDecimal gordura100g;

    @Column(name = "fibra_100g", precision = 12, scale = 6)
    private BigDecimal fibra100g;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<SubstitutoItemRefeicao> substitutos = new ArrayList<>();

    protected ItemRefeicao() {}

    public ItemRefeicao(Alimento alimento, BigDecimal gramas) {
        this(null, alimento, gramas);
    }

    void vincular(Refeicao refeicao) {
        this.refeicao = refeicao;
    }

    public List<SubstitutoItemRefeicao> getSubstitutos() {
        return substitutos;
    }

    public void adicionarSubstituto(Alimento alimento, BigDecimal gramas) {
        substitutos.add(new SubstitutoItemRefeicao(this, alimento, gramas));
    }

    public ItemRefeicao(Refeicao refeicao, Alimento alimento, BigDecimal gramas) {
        this.refeicao = refeicao;
        this.alimento = alimento;
        this.quantidadeGramas = gramas;
        Nutrientes nutrientes = alimento.nutrientes();
        kcal100g = nutrientes.kcal();
        proteina100g = nutrientes.proteinas();
        carboidratos100g = nutrientes.carboidratos();
        gordura100g = nutrientes.gorduras();
        fibra100g = nutrientes.fibras();
    }

    public Alimento getAlimento() {
        return alimento;
    }

    public BigDecimal getQuantidadeGramas() {
        return quantidadeGramas;
    }

    public BigDecimal getKcal() { return nutrientes().kcal(); }
    public BigDecimal getProteina() { return nutrientes().proteinas(); }
    public BigDecimal getCarboidratos() { return nutrientes().carboidratos(); }
    public BigDecimal getGordura() { return nutrientes().gorduras(); }

    public boolean calculavel() {
        return kcal100g != null
                && proteina100g != null
                && carboidratos100g != null
                && gordura100g != null;
    }

    public Nutrientes nutrientes() {
        return new Nutrientes(kcal100g, proteina100g, carboidratos100g, gordura100g, fibra100g)
                .proporcional(quantidadeGramas);
    }
}
