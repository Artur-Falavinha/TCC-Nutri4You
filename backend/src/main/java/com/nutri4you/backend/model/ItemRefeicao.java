package com.nutri4you.backend.model;

import com.nutri4you.backend.dto.PrescricaoDTO.Nutrientes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

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

    protected ItemRefeicao() {}

    public ItemRefeicao(Refeicao refeicao, Alimento alimento, BigDecimal gramas) {
        this.refeicao = refeicao;
        this.alimento = alimento;
        this.quantidadeGramas = gramas;
        Nutrientes nutrientes = alimento.nutrientes();
        kcal100g = nutrientes.kcal();
        proteina100g = nutrientes.proteinas();
        carboidratos100g = nutrientes.carboidratos();
        gordura100g = nutrientes.gorduras();
    }

    public Alimento getAlimento() {
        return alimento;
    }

    public BigDecimal getQuantidadeGramas() {
        return quantidadeGramas;
    }

    public boolean calculavel() {
        return kcal100g != null
                && proteina100g != null
                && carboidratos100g != null
                && gordura100g != null;
    }

    public Nutrientes nutrientes() {
        return new Nutrientes(kcal100g, proteina100g, carboidratos100g, gordura100g)
                .proporcional(quantidadeGramas);
    }
}
