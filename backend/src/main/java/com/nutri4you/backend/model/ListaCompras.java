package com.nutri4you.backend.model;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "Lista_Compras",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_plano", "dias"}))
public class ListaCompras {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lista")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_plano", nullable = false)
    private PlanoAlimentar plano;

    @Column(nullable = false)
    private int dias;

    @Column(name = "data_geracao", nullable = false)
    private LocalDate dataGeracao;

    @OneToMany(mappedBy = "lista", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemListaCompras> itens = new ArrayList<>();

    protected ListaCompras() {}

    public ListaCompras(PlanoAlimentar plano, int dias) {
        this.plano = plano;
        this.dias = dias;
        this.dataGeracao = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
    }

    public List<ItemListaCompras> getItens() {
        return itens;
    }

    public void marcar(Alimento alimento, boolean comprado) {
        ItemListaCompras item =
                itens.stream()
                        .filter(
                                i ->
                                        i.getAlimento() != null
                                                && i.getAlimento().getId().equals(alimento.getId()))
                        .findFirst()
                        .orElseGet(
                                () -> {
                                    var novo = new ItemListaCompras(this, alimento);
                                    itens.add(novo);
                                    return novo;
                                });
        item.marcar(comprado);
    }
}
