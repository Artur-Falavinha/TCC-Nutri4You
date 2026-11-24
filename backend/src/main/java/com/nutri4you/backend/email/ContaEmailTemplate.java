package com.nutri4you.backend.email;

import com.nutri4you.backend.model.TipoCadastro;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ContaEmailTemplate {

    private static final Pattern MARCADOR = Pattern.compile("\\{\\{([A-Z_]+)}}");

    private final String modelo;
    private final String blocoCodigo;

    public ContaEmailTemplate(
            @Value("classpath:email/conta.html") Resource modelo,
            @Value("classpath:email/codigo.html") Resource blocoCodigo) throws IOException {
        this.modelo = modelo.getContentAsString(StandardCharsets.UTF_8);
        this.blocoCodigo = blocoCodigo.getContentAsString(StandardCharsets.UTF_8);
    }

    public Conteudo confirmacaoCadastro(TipoCadastro tipoUsuario, UUID token, String link, long validadeHoras) {
        boolean paciente = tipoUsuario == TipoCadastro.PACIENTE;
        String titulo = paciente ? "Seu código de confirmação" : "Confirme seu e-mail";
        String introducao = paciente
                ? "Cole o código abaixo no aplicativo Nutri4You para continuar."
                : "Confirme seu endereço para continuar o cadastro no Nutri4You.";
        String acao = paciente ? "Confirmar no computador" : "Confirmar e-mail";
        String validade = "Confirme em até %d h. Depois da confirmação, você tem 30 minutos para concluir o cadastro."
                .formatted(validadeHoras);
        return renderizar(new Mensagem(titulo, introducao, acao, link, validade,
                "Se você não solicitou este cadastro, ignore este e-mail.",
                paciente ? new Codigo("Código de confirmação", token) : null));
    }

    public Conteudo recuperacaoSenha(String nome, UUID token, String link, long validadeHoras) {
        return renderizar(new Mensagem(
                "Redefina sua senha",
                "Olá, %s! Cole o código abaixo no aplicativo Nutri4You ou use o botão para redefinir sua senha no navegador."
                        .formatted(nome),
                "Redefinir senha", link,
                "O código e o link expiram em %d h.".formatted(validadeHoras),
                "Se você não solicitou a redefinição da senha, ignore este e-mail.",
                new Codigo("Código de verificação", token)));
    }

    public Conteudo notificacaoAgenda(String titulo, String introducao, String detalhe, String acao, String link) {
        return renderizar(new Mensagem(titulo, introducao, acao, link, detalhe,
                "Gerencie os avisos por e-mail em Configurações no Nutri4You.", null));
    }

    private Conteudo renderizar(Mensagem mensagem) {
        Codigo codigo = mensagem.codigo();
        String htmlCodigo = codigo == null ? "" : preencher(blocoCodigo, Map.of(
                "ROTULO_CODIGO", escaparHtml(codigo.rotulo()),
                "TOKEN", codigo.token().toString()));
        String html = preencher(modelo, Map.of(
                "TITULO", escaparHtml(mensagem.titulo()),
                "INTRODUCAO", escaparHtml(mensagem.introducao()),
                "CODIGO", htmlCodigo,
                "LINK", escaparHtml(mensagem.link()),
                "ACAO", escaparHtml(mensagem.acao()),
                "VALIDADE", escaparHtml(mensagem.validade()),
                "RODAPE", escaparHtml(mensagem.rodape())));
        String textoCodigo = codigo == null ? "" : "\n" + codigo.rotulo() + "\n" + codigo.token() + "\n";
        String texto = """
                %s

                %s
                %s
                %s
                %s

                %s
                %s
                """.formatted(mensagem.titulo(), mensagem.introducao(), textoCodigo,
                mensagem.acao(), mensagem.link(), mensagem.validade(), mensagem.rodape());
        return new Conteudo(texto, html);
    }

    private static String escaparHtml(String texto) {
        return HtmlUtils.htmlEscape(texto, StandardCharsets.UTF_8.name());
    }

    private static String preencher(String template, Map<String, String> valores) {
        return MARCADOR.matcher(template).replaceAll(
                marcador -> Matcher.quoteReplacement(valores.get(marcador.group(1))));
    }

    private record Codigo(String rotulo, UUID token) {
    }

    private record Mensagem(String titulo, String introducao, String acao, String link,
                            String validade, String rodape, Codigo codigo) {
    }

    public record Conteudo(String texto, String html) {
    }
}
