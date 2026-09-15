package com.nutri4you.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {

    private boolean autoConfirm = false;
    private String apiBaseUrl = "http://localhost:8080/api/v1";
    private String webBaseUrl = "http://localhost:4200";
    private long confirmacaoTtlHoras = 24;
    private long recuperacaoTtlHoras = 1;

    public boolean isAutoConfirm() {
        return autoConfirm;
    }

    public void setAutoConfirm(boolean autoConfirm) {
        this.autoConfirm = autoConfirm;
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public void setApiBaseUrl(String apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
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
