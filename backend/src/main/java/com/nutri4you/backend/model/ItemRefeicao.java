package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "Item_Refeicao")
public class ItemRefeicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item_refeicao")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_refeicao", nullable = false)
    private Refeicao refeicao;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_alimento", nullable = false)
    private Alimento alimento;

    @Column(name = "quantidade_gramas", nullable = false, precision = 6, scale = 2)
    private BigDecimal quantidadeGramas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_item_principal")
    private ItemRefeicao itemPrincipal;

    @Column(name = "ordem", nullable = false)
    private Integer ordem = 0;

    protected ItemRefeicao() {
    }

    public ItemRefeicao(
            Refeicao refeicao,
            Alimento alimento,
            BigDecimal quantidadeGramas,
            ItemRefeicao itemPrincipal,
            Integer ordem) {
        this.refeicao = refeicao;
        this.alimento = alimento;
        this.quantidadeGramas = quantidadeGramas;
        this.itemPrincipal = itemPrincipal;
        this.ordem = ordem == null ? 0 : ordem;
    }

    public Integer getId() {
        return id;
    }

    public Refeicao getRefeicao() {
        return refeicao;
    }

    public Alimento getAlimento() {
        return alimento;
    }

    public void setAlimento(Alimento alimento) {
        this.alimento = alimento;
    }

    public BigDecimal getQuantidadeGramas() {
        return quantidadeGramas;
    }

    public void setQuantidadeGramas(BigDecimal quantidadeGramas) {
        this.quantidadeGramas = quantidadeGramas;
    }

    public ItemRefeicao getItemPrincipal() {
        return itemPrincipal;
    }

    public void setItemPrincipal(ItemRefeicao itemPrincipal) {
        this.itemPrincipal = itemPrincipal;
    }

    public Integer getOrdem() {
        return ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem == null ? 0 : ordem;
    }
}

