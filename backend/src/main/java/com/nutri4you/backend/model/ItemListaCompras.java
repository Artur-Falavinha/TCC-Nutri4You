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
@Table(name = "Item_Lista_Compras")
public class ItemListaCompras {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_item_lista")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_lista", nullable = false)
    private ListaCompras lista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_alimento")
    private Alimento alimento;

    @Column(name = "nome_item", nullable = false, length = 150)
    private String nomeItem;

    @Column(name = "categoria", length = 100)
    private String categoria;

    @Column(name = "quantidade", length = 50)
    private String quantidade;

    @Column(name = "quantidade_gramas", precision = 8, scale = 2)
    private BigDecimal quantidadeGramas = BigDecimal.ZERO;

    @Column(name = "comprado")
    private Boolean comprado = false;

    protected ItemListaCompras() {
    }

    public ItemListaCompras(
            ListaCompras lista,
            Alimento alimento,
            String nomeItem,
            String categoria,
            String quantidade,
            BigDecimal quantidadeGramas) {
        this.lista = lista;
        this.alimento = alimento;
        this.nomeItem = nomeItem;
        this.categoria = categoria;
        this.quantidade = quantidade;
        this.quantidadeGramas = quantidadeGramas == null ? BigDecimal.ZERO : quantidadeGramas;
        this.comprado = false;
    }

    public Integer getId() {
        return id;
    }

    public ListaCompras getLista() {
        return lista;
    }

    public Alimento getAlimento() {
        return alimento;
    }

    public String getNomeItem() {
        return nomeItem;
    }

    public String getCategoria() {
        return categoria;
    }

    public String getQuantidade() {
        return quantidade;
    }

    public BigDecimal getQuantidadeGramas() {
        return quantidadeGramas;
    }

    public Boolean getComprado() {
        return comprado;
    }

    public void setComprado(Boolean comprado) {
        this.comprado = Boolean.TRUE.equals(comprado);
    }
}

