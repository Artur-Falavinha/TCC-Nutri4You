package com.nutri4you.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "Consumo_Refeicao", uniqueConstraints = @UniqueConstraint(columnNames = {"id_paciente", "id_refeicao", "data_registro"}))
public class ConsumoRefeicao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_paciente") private Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "id_refeicao") private Refeicao refeicao;
    @Column(name = "data_registro", nullable = false) private LocalDate data;
    @Column(nullable = false) private boolean consumida;
    protected ConsumoRefeicao() {}
    public ConsumoRefeicao(Paciente paciente, Refeicao refeicao, LocalDate data) {
        this.paciente = paciente; this.refeicao = refeicao; this.data = data;
    }
    public Refeicao getRefeicao() { return refeicao; }
    public boolean isConsumida() { return consumida; }
    public void marcar(boolean consumida) { this.consumida = consumida; }
}
