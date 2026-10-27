package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Refeicao")
public class Refeicao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id_refeicao")
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_plano", nullable = false)
    private PlanoAlimentar plano;
    @Column(nullable = false, length = 100) private String nome;
    @Column(nullable = false) private LocalTime horario;
    @Column(name = "dia_semana", nullable = false) private int diaSemana;
    @ElementCollection
    @CollectionTable(name = "Item_Refeicao", joinColumns = @JoinColumn(name = "id_refeicao"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"id_refeicao", "id_alimento"}))
    private List<ItemRefeicao> itens = new ArrayList<>();
    protected Refeicao() {}
    public Refeicao(PlanoAlimentar plano) { this.plano = plano; }
    public void editar(String nome, LocalTime horario, int diaSemana, List<ItemRefeicao> itens) {
        this.nome = nome; this.horario = horario; this.diaSemana = diaSemana;
        this.itens.clear(); this.itens.addAll(itens);
    }
    public Integer getId() { return id; }
    public String getNome() { return nome; }
    public LocalTime getHorario() { return horario; }
    public int getDiaSemana() { return diaSemana; }
    public List<ItemRefeicao> getItens() { return itens; }
}
