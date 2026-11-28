package com.nutri4you.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Entity
@DynamicUpdate
@Table(name = "Paciente", uniqueConstraints = @UniqueConstraint(name = Paciente.RESTRICAO_CPF_UNICO, columnNames = "cpf"))
public class Paciente implements ContaAutenticavel {

    public static final String RESTRICAO_CPF_UNICO = "uq_paciente_cpf";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_paciente")
    private Integer id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 14)
    private String cpf;

    @Column(name = "cpf_original_conflitante", length = 14, insertable = false, updatable = false)
    private String cpfOriginalConflitante;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(length = 20)
    private String sexo;

    @Column(length = 20)
    private String telefone;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String senha;

    @Column(name = "versao_credencial", nullable = false)
    @ColumnDefault("0")
    private int versaoCredencial;

    @Column(name = "email_confirmado", nullable = false)
    private boolean emailConfirmado = false;

    @Column(name = "lembretes_consulta_ativos", nullable = false, updatable = false)
    @ColumnDefault("true")
    private boolean lembretesConsultaAtivos = true;

    protected Paciente() {
    }

    public Paciente(String nome, String email, String senha) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    public Paciente(String nome, String cpf, LocalDate dataNascimento, String sexo,
                    String telefone, String email, String senha) {
        this.nome = nome;
        this.cpf = normalizarCpf(cpf);
        this.dataNascimento = dataNascimento;
        this.sexo = sexo;
        this.telefone = telefone;
        this.email = email;
        this.senha = senha;
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public void setSexo(String sexo) {
        this.sexo = sexo;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public String getCpf() {
        return cpfOriginalConflitante == null ? cpf : cpfOriginalConflitante;
    }

    public static String normalizarCpf(String cpf) {
        if (cpf == null) {
            return null;
        }
        String digitos = cpf.replaceAll("[^0-9]", "");
        return digitos.isEmpty() ? null : digitos;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public String getSexo() {
        return sexo;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public TipoCadastro getTipoCadastro() {
        return TipoCadastro.PACIENTE;
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

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
        versaoCredencial++;
    }

    public boolean isEmailConfirmado() {
        return emailConfirmado;
    }

    public boolean recebeLembretesConsulta() {
        return lembretesConsultaAtivos;
    }

    public void setEmailConfirmado(boolean emailConfirmado) {
        this.emailConfirmado = emailConfirmado;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_PACIENTE"));
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return emailConfirmado;
    }
}
