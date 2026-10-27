package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Embeddable
public class ItemRefeicao {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_alimento", nullable = false)
    private Alimento alimento;
    @Column(name = "quantidade_gramas", nullable = false, precision = 6, scale = 2)
    private BigDecimal quantidadeGramas;
    protected ItemRefeicao() {}
    public ItemRefeicao(Alimento alimento, BigDecimal quantidadeGramas) {
        this.alimento = alimento; this.quantidadeGramas = quantidadeGramas;
    }
    public Alimento getAlimento() { return alimento; }
    public BigDecimal getQuantidadeGramas() { return quantidadeGramas; }
}
