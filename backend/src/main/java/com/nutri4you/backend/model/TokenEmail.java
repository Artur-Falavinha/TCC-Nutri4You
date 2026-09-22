package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import org.hibernate.annotations.Check;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "Token_Email")
@Check(constraints = """
        (id_paciente IS NOT NULL AND id_nutricionista IS NULL)
        OR (id_paciente IS NULL AND id_nutricionista IS NOT NULL)
        """)
public class TokenEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_token")
    private Integer id;

    @Column(nullable = false, unique = true)
    private UUID token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoTokenEmail tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_paciente")
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_nutricionista")
    private Nutricionista nutricionista;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(name = "usado_em")
    private LocalDateTime usadoEm;

    protected TokenEmail() {
    }

    public static TokenEmail criarParaPaciente(Paciente paciente, TipoTokenEmail tipo, LocalDateTime expiraEm) {
        TokenEmail tokenEmail = new TokenEmail();
        tokenEmail.token = UUID.randomUUID();
        tokenEmail.paciente = paciente;
        tokenEmail.tipo = tipo;
        tokenEmail.expiraEm = expiraEm;
        return tokenEmail;
    }

    public static TokenEmail criarParaNutricionista(
            Nutricionista nutricionista,
            TipoTokenEmail tipo,
            LocalDateTime expiraEm) {
        TokenEmail tokenEmail = new TokenEmail();
        tokenEmail.token = UUID.randomUUID();
        tokenEmail.nutricionista = nutricionista;
        tokenEmail.tipo = tipo;
        tokenEmail.expiraEm = expiraEm;
        return tokenEmail;
    }

    public void marcarComoUsado() {
        this.usadoEm = LocalDateTime.now();
    }

    public boolean isExpirado() {
        return LocalDateTime.now().isAfter(expiraEm);
    }

    public boolean isUsado() {
        return usadoEm != null;
    }

    public String getEmailDestinatario() {
        if (paciente != null) {
            return paciente.getEmail();
        }
        if (nutricionista != null) {
            return nutricionista.getEmail();
        }
        throw new IllegalStateException("Token sem titular associado.");
    }

    public String getNomeDestinatario() {
        if (paciente != null) {
            return paciente.getNome();
        }
        if (nutricionista != null) {
            return nutricionista.getNome();
        }
        throw new IllegalStateException("Token sem titular associado.");
    }

    public Integer getId() {
        return id;
    }

    public UUID getToken() {
        return token;
    }

    public TipoTokenEmail getTipo() {
        return tipo;
    }

    public Paciente getPaciente() {
        return paciente;
    }

    public Nutricionista getNutricionista() {
        return nutricionista;
    }

    public LocalDateTime getExpiraEm() {
        return expiraEm;
    }

    public LocalDateTime getUsadoEm() {
        return usadoEm;
    }
}
