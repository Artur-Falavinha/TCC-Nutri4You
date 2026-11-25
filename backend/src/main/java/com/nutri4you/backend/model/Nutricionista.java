package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.hibernate.annotations.DynamicUpdate;

import java.util.Collection;
import java.util.List;

@Entity
@DynamicUpdate
@Table(name = "Nutricionista")
public class Nutricionista implements ContaAutenticavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_nutricionista")
    private Integer id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String senha;

    @Column(name = "versao_credencial", nullable = false)
    private int versaoCredencial;

    @Column(nullable = false, unique = true, length = 20)
    private String crn;

    @Column(name = "email_confirmado", nullable = false)
    private boolean emailConfirmado;

    @Column(name = "aceita_consultas_avulsas", nullable = false)
    private boolean aceitaConsultasAvulsas;

    @Column(name = "notificacoes_email_agenda", nullable = false)
    private boolean notificacoesEmailAgenda;

    protected Nutricionista() {
    }

    public Nutricionista(String nome, String email, String senha, String crn) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.crn = crn;
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getCrn() {
        return crn;
    }

    public void atualizarPerfil(String nome, String crn) {
        this.nome = nome;
        this.crn = crn;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public TipoCadastro getTipoCadastro() {
        return TipoCadastro.NUTRICIONISTA;
    }

    @Override
    public int getVersaoCredencial() {
        return versaoCredencial;
    }

    @Override
    public void alterarEmail(String email) {
        this.email = email;
        versaoCredencial++;
    }

    public boolean aceitaConsultasAvulsas() {
        return aceitaConsultasAvulsas;
    }

    public void definirAceiteDeConsultasAvulsas(boolean aceita) {
        this.aceitaConsultasAvulsas = aceita;
    }

    public boolean notificaAgendaPorEmail() {
        return notificacoesEmailAgenda;
    }

    public void definirNotificacoesEmailAgenda(boolean ativas) {
        this.notificacoesEmailAgenda = ativas;
    }

    public void setSenha(String senha) {
        this.senha = senha;
        versaoCredencial++;
    }

    public void confirmarEmail() {
        emailConfirmado = true;
    }

    @Override
    public boolean isEnabled() {
        return emailConfirmado;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_NUTRICIONISTA"));
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
