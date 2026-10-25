package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "Lista_Compras")
public class ListaCompras {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lista")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_plano", nullable = false, unique = true)
    private PlanoAlimentar plano;

    @Column(name = "data_geracao", nullable = false)
    private LocalDate dataGeracao;

    protected ListaCompras() {
    }

    public ListaCompras(PlanoAlimentar plano, LocalDate dataGeracao) {
        this.plano = plano;
        this.dataGeracao = dataGeracao;
    }

    public Integer getId() {
        return id;
    }

    public PlanoAlimentar getPlano() {
        return plano;
    }

    public LocalDate getDataGeracao() {
        return dataGeracao;
    }

    public void setDataGeracao(LocalDate dataGeracao) {
        this.dataGeracao = dataGeracao;
    }
}

