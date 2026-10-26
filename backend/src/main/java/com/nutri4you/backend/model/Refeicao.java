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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Refeicao")
public class Refeicao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_refeicao")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_plano", nullable = false)
    private PlanoAlimentar plano;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false)
    private LocalTime horario;

    @OneToMany(mappedBy = "refeicao", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("alimento.id")
    private List<ItemRefeicao> itens = new ArrayList<>();

    protected Refeicao() {}

    public Refeicao(PlanoAlimentar plano, String nome, LocalTime horario) {
        this.plano = plano;
        this.nome = nome;
        this.horario = horario;
    }

    public ItemRefeicao adicionar(Alimento alimento, BigDecimal gramas) {
        ItemRefeicao item = new ItemRefeicao(this, alimento, gramas);
        itens.add(item);
        return item;
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public LocalTime getHorario() {
        return horario;
    }

    public List<ItemRefeicao> getItens() {
        return itens;
    }
}
