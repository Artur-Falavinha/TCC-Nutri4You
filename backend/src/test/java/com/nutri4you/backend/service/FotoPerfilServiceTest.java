package com.nutri4you.backend.service;

import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.FotoPerfilRepository;
import com.nutri4you.backend.repository.FotoPerfilRepository.TipoTitular;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class FotoPerfilServiceTest {
    private final FotoPerfilRepository repositorio = mock(FotoPerfilRepository.class);
    private final FotoPerfilService servico = new FotoPerfilService(repositorio);

    @Test
    void usaOEscopoDoTitularMesmoQuandoOsIdsCoincidem() throws IOException {
        var paciente = new Paciente("Paciente", "paciente@example.test", "hash");
        var nutricionista = new Nutricionista("Nutricionista", "nutri@example.test", "hash", "1234");
        ReflectionTestUtils.setField(paciente, "id", 7);
        ReflectionTestUtils.setField(nutricionista, "id", 7);
        var arquivo = png(960, 640);

        byte[] jpeg = servico.salvar(paciente, arquivo);
        servico.buscar(nutricionista);
        servico.remover(nutricionista);

        verify(repositorio).salvar(TipoTitular.PACIENTE, 7, jpeg);
        verify(repositorio).buscar(TipoTitular.NUTRICIONISTA, 7);
        verify(repositorio).remover(TipoTitular.NUTRICIONISTA, 7);
        assertThat(jpeg).startsWith((byte) 0xFF, (byte) 0xD8);
        var imagem = ImageIO.read(new ByteArrayInputStream(jpeg));
        assertThat(imagem.getWidth()).isEqualTo(384);
        assertThat(imagem.getHeight()).isEqualTo(256);
    }

    @Test
    void rejeitaImagemInvalidaSemSubstituirFoto() {
        var paciente = new Paciente("Paciente", "paciente@example.test", "hash");
        ReflectionTestUtils.setField(paciente, "id", 7);
        var invalida = new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg", new byte[] {1, 2});

        assertThatThrownBy(() -> servico.salvar(paciente, invalida)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(repositorio);
    }

    @Test
    void rejeitaAcessoSemTitular() {
        assertThatThrownBy(() -> servico.buscar(null)).isInstanceOf(AcessoNegadoException.class);
        assertThatThrownBy(() -> servico.remover("anonymousUser")).isInstanceOf(AcessoNegadoException.class);
        verifyNoInteractions(repositorio);
    }

    private static MockMultipartFile png(int largura, int altura) throws IOException {
        var saida = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(largura, altura, BufferedImage.TYPE_INT_ARGB), "PNG", saida);
        return new MockMultipartFile("arquivo", "foto.png", "image/png", saida.toByteArray());
    }
}
