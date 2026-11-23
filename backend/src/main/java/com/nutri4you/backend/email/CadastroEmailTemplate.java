package com.nutri4you.backend.email;

import com.nutri4you.backend.model.TipoCadastro;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class CadastroEmailTemplate {

    private final String modelo;
    private final String blocoCodigo;

    public CadastroEmailTemplate(
            @Value("classpath:email/confirmacao-cadastro.html") Resource modelo,
            @Value("classpath:email/codigo-cadastro.html") Resource blocoCodigo) throws IOException {
        this.modelo = modelo.getContentAsString(StandardCharsets.UTF_8);
        this.blocoCodigo = blocoCodigo.getContentAsString(StandardCharsets.UTF_8);
    }

    public Conteudo criar(TipoCadastro tipoUsuario, UUID token, String link, long validadeHoras) {
        boolean paciente = tipoUsuario == TipoCadastro.PACIENTE;
        String titulo = paciente ? "Seu código de confirmação" : "Confirme seu e-mail";
        String introducao = paciente
                ? "Cole o código abaixo no aplicativo Nutri4You para continuar."
                : "Confirme seu endereço para continuar o cadastro no Nutri4You.";
        String acao = paciente ? "Confirmar no computador" : "Confirmar e-mail";
        String validade = """
                Confirme em até %d h. Depois da confirmação, você tem 30 minutos para concluir o cadastro.
                """.formatted(validadeHoras).strip();
        String html = modelo
                .replace("{{TITULO}}", titulo)
                .replace("{{INTRODUCAO}}", introducao)
                .replace("{{CODIGO}}", paciente ? blocoCodigo.replace("{{TOKEN}}", token.toString()) : "")
                .replace("{{LINK}}", HtmlUtils.htmlEscape(link))
                .replace("{{ACAO}}", acao)
                .replace("{{VALIDADE}}", validade);
        String codigo = paciente ? "\n" + token + "\n" : "";
        String texto = """
                %s

                %s
                %s
                %s
                %s

                %s
                Se você não solicitou este cadastro, ignore este e-mail.
                """.formatted(titulo, introducao, codigo, acao, link, validade);
        return new Conteudo(texto, html);
    }

    public record Conteudo(String texto, String html) {
    }
}
