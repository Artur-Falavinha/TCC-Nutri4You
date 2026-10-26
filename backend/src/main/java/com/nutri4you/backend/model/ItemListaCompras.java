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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "Item_Lista_Compras",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_lista", "id_alimento"}))
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

    private boolean comprado;

    protected ItemListaCompras() {}

    public ItemListaCompras(ListaCompras lista, Alimento alimento) {
        this.lista = lista;
        this.alimento = alimento;
        this.nomeItem = alimento.getNome();
    }

    public Alimento getAlimento() {
        return alimento;
    }

    public boolean isComprado() {
        return comprado;
    }

    public void marcar(boolean comprado) {
        this.comprado = comprado;
    }
}
