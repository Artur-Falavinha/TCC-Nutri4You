package com.nutri4you.backend.model;

import com.nutri4you.backend.dto.PrescricaoDTO.Nutrientes;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinColumns;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "Substituto_Item_Refeicao")
public class SubstitutoItemRefeicao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_substituto")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumns({
        @JoinColumn(name = "id_refeicao", referencedColumnName = "id_refeicao", nullable = false),
        @JoinColumn(name = "id_alimento_principal", referencedColumnName = "id_alimento", nullable = false)
    })
    private ItemRefeicao item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_alimento_substituto", nullable = false)
    private Alimento alimento;

    @Column(name = "quantidade_gramas", nullable = false, precision = 8, scale = 2)
    private BigDecimal quantidadeGramas;
    @Column(name = "kcal_100g", nullable = false, precision = 12, scale = 6)
    private BigDecimal kcal100g;
    @Column(name = "proteina_100g", nullable = false, precision = 12, scale = 6)
    private BigDecimal proteina100g;
    @Column(name = "carboidratos_100g", nullable = false, precision = 12, scale = 6)
    private BigDecimal carboidratos100g;
    @Column(name = "gordura_100g", nullable = false, precision = 12, scale = 6)
    private BigDecimal gordura100g;
    @Column(name = "fibra_100g", precision = 12, scale = 6)
    private BigDecimal fibra100g;

    protected SubstitutoItemRefeicao() {}

    public SubstitutoItemRefeicao(ItemRefeicao item, Alimento alimento, BigDecimal gramas) {
        this.item = item;
        this.alimento = alimento;
        quantidadeGramas = gramas;
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

    public Nutrientes nutrientes() {
        return new Nutrientes(kcal100g, proteina100g, carboidratos100g, gordura100g, fibra100g)
                .proporcional(quantidadeGramas);
    }
}
