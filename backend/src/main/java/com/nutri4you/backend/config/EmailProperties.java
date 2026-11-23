package com.nutri4you.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.UUID;

@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {

    private String webBaseUrl = "http://localhost:4200";
    private long confirmacaoTtlHoras = 24;
    private long recuperacaoTtlHoras = 1;

    public String linkConfirmacao(UUID token) {
        return paginaConfirmacao() + "#token=" + token;
    }

    public String linkCadastro(UUID token) {
        return paginaConfirmacao() + "#cadastro=" + token;
    }

    private String paginaConfirmacao() {
        return webBaseUrl.replaceFirst("/+$", "") + "/confirmar-email";
    }

    public String getWebBaseUrl() {
        return webBaseUrl;
    }

    public void setWebBaseUrl(String webBaseUrl) {
        this.webBaseUrl = webBaseUrl;
    }

    public long getConfirmacaoTtlHoras() {
        return confirmacaoTtlHoras;
    }

    public void setConfirmacaoTtlHoras(long confirmacaoTtlHoras) {
        this.confirmacaoTtlHoras = confirmacaoTtlHoras;
    }

    public long getRecuperacaoTtlHoras() {
        return recuperacaoTtlHoras;
    }

    public void setRecuperacaoTtlHoras(long recuperacaoTtlHoras) {
        this.recuperacaoTtlHoras = recuperacaoTtlHoras;
    }
}
