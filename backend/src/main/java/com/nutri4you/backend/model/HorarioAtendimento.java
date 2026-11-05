package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "Horario_Atendimento", uniqueConstraints = @UniqueConstraint(columnNames = {"id_nutricionista", "dia_semana", "horario"}))
public class HorarioAtendimento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_nutricionista", nullable = false)
    private Nutricionista nutricionista;
    @Column(name = "dia_semana", nullable = false)
    private int diaSemana;
    @Column(nullable = false)
    private LocalTime horario;

    protected HorarioAtendimento() {}
    public HorarioAtendimento(Nutricionista nutricionista, int diaSemana, LocalTime horario) {
        this.nutricionista = nutricionista;
        this.diaSemana = diaSemana;
        this.horario = horario;
    }
    public int getDiaSemana() { return diaSemana; }
    public LocalTime getHorario() { return horario; }
}
