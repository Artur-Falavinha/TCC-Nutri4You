package com.nutri4you.backend.model;

import org.springframework.security.core.userdetails.UserDetails;

public interface ContaAutenticavel extends UserDetails {
    Integer getId();
    String getEmail();
    TipoCadastro getTipoCadastro();
    int getVersaoCredencial();
    void alterarEmail(String email);
}
