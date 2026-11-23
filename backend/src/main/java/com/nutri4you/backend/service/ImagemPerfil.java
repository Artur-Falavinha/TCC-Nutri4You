package com.nutri4you.backend.service;

import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

final class ImagemPerfil {
    private static final int LIMITE_BYTES = 5 * 1024 * 1024;
    private static final int LIMITE_DIMENSAO = 8192;
    private static final long LIMITE_PIXELS = 32_000_000;
    private static final int DIMENSAO_AVATAR = 384;
    private static final String IMAGEM_INVALIDA = "Envie uma imagem JPEG ou PNG válida de até 5 MB.";

    private ImagemPerfil() {}

    static byte[] normalizar(MultipartFile arquivo) {
        if (arquivo.isEmpty() || arquivo.getSize() > LIMITE_BYTES) {
            throw new IllegalArgumentException(IMAGEM_INVALIDA);
        }
        try (var entrada = new MemoryCacheImageInputStream(arquivo.getInputStream())) {
            var leitores = ImageIO.getImageReaders(entrada);
            if (!leitores.hasNext()) throw new IllegalArgumentException(IMAGEM_INVALIDA);
            var leitor = leitores.next();
            try {
                return codificarJpeg(decodificar(leitor, entrada));
            } finally {
                leitor.dispose();
            }
        } catch (IOException excecao) {
            throw new IllegalArgumentException(IMAGEM_INVALIDA, excecao);
        }
    }

    private static BufferedImage decodificar(ImageReader leitor, MemoryCacheImageInputStream entrada) throws IOException {
        String formato = leitor.getFormatName();
        if (!formato.equalsIgnoreCase("JPEG") && !formato.equalsIgnoreCase("PNG")) {
            throw new IllegalArgumentException(IMAGEM_INVALIDA);
        }
        leitor.setInput(entrada, true, true);
        int largura = leitor.getWidth(0);
        int altura = leitor.getHeight(0);
        if (Math.max(largura, altura) > LIMITE_DIMENSAO || (long) largura * altura > LIMITE_PIXELS) {
            throw new IllegalArgumentException("As dimensões da imagem são muito grandes.");
        }
        int intervalo = Math.max(1, Math.max(largura, altura) / (2 * DIMENSAO_AVATAR));
        var parametros = leitor.getDefaultReadParam();
        parametros.setSourceSubsampling(intervalo, intervalo, 0, 0);
        return leitor.read(0, parametros);
    }

    private static byte[] codificarJpeg(BufferedImage original) throws IOException {
        double escala = Math.min(1, (double) DIMENSAO_AVATAR / Math.max(original.getWidth(), original.getHeight()));
        int largura = Math.max(1, (int) Math.round(original.getWidth() * escala));
        int altura = Math.max(1, (int) Math.round(original.getHeight() * escala));
        var imagem = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        var desenho = imagem.createGraphics();
        try {
            desenho.setColor(Color.WHITE);
            desenho.fillRect(0, 0, largura, altura);
            desenho.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            desenho.drawImage(original, 0, 0, largura, altura, null);
        } finally {
            desenho.dispose();
        }
        var saida = new ByteArrayOutputStream();
        if (!ImageIO.write(imagem, "JPEG", saida)) throw new IOException("Codificador JPEG indisponível.");
        return saida.toByteArray();
    }
}
