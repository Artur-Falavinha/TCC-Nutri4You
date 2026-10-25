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

import java.time.LocalTime;

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

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "horario", nullable = false)
    private LocalTime horario;

    @Column(name = "dia_semana", nullable = false, length = 20)
    private String diaSemana = "SEGUNDA";

    @Column(name = "descricao", length = 255)
    private String descricao;

    @Column(name = "ordem", nullable = false)
    private Integer ordem = 0;

    protected Refeicao() {
    }

    public Refeicao(
            PlanoAlimentar plano,
            String nome,
            LocalTime horario,
            String diaSemana,
            String descricao,
            Integer ordem) {
        this.plano = plano;
        this.nome = nome;
        this.horario = horario;
        this.diaSemana = (diaSemana == null || diaSemana.isBlank()) ? "SEGUNDA" : diaSemana.trim().toUpperCase();
        this.descricao = descricao;
        this.ordem = ordem == null ? 0 : ordem;
    }

    public Integer getId() {
        return id;
    }

    public PlanoAlimentar getPlano() {
        return plano;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public LocalTime getHorario() {
        return horario;
    }

    public void setHorario(LocalTime horario) {
        this.horario = horario;
    }

    public String getDiaSemana() {
        return diaSemana;
    }

    public void setDiaSemana(String diaSemana) {
        this.diaSemana = (diaSemana == null || diaSemana.isBlank()) ? "SEGUNDA" : diaSemana.trim().toUpperCase();
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Integer getOrdem() {
        return ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem == null ? 0 : ordem;
    }
}

