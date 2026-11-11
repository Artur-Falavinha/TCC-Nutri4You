package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.ExameResponse;
import com.nutri4you.backend.exception.*;
import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.ExameRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class ExameService {
    public static final long LIMITE_BYTES = 5 * 1024 * 1024;
    private final ExameRepository exames;
    private final GestaoPacienteService gestao;
    private final AtendimentoClinicoService atendimentos;
    private final Clock clock;
    public ExameService(ExameRepository exames, GestaoPacienteService gestao,
            AtendimentoClinicoService atendimentos, Clock clock) {
        this.exames = exames;
        this.gestao = gestao;
        this.atendimentos = atendimentos;
        this.clock = clock;
    }
    public record Solicitacao(String nome, String descricao) {}
    public record Analise(String parecer, Long versao) {}
    public record Pagina(List<ExameResponse> itens, int pagina, int totalPaginas, long total) {}
    public record Arquivo(byte[] dados, String nome, String tipo) {}

    @Transactional
    public ExameResponse solicitar(Nutricionista n, Integer pacienteId, Integer atendimentoId, Solicitacao r) {
        Consulta consulta = atendimentoId == null ? null : atendimentos.exigirEmAndamento(n, atendimentoId, pacienteId);
        Paciente p = consulta == null ? gestao.exigirAcesso(n, pacienteId) : consulta.getPaciente();
        if (r == null || r.nome() == null || r.nome().isBlank() || r.nome().trim().length() > 150
                || (r.descricao() != null && r.descricao().length() > 5000)) {
            throw new IllegalArgumentException("Informe nome de até 150 caracteres e descrição de até 5000 caracteres.");
        }
        Exame exame = new Exame(p, n, consulta, r.nome().trim(), r.descricao(), LocalDate.now(clock));
        return ExameResponse.from(exames.saveAndFlush(exame));
    }
    @Transactional(readOnly = true)
    public Pagina listar(Nutricionista n, Integer pacienteId, Integer atendimentoId, int pagina) {
        exigirAcessoAoEscopo(n, pacienteId, atendimentoId);
        return pagina(pacienteId, n.getId(), atendimentoId, pagina);
    }
    @Transactional(readOnly = true)
    public Pagina listar(Paciente p, int pagina) { return pagina(p.getId(), null, null, pagina); }
    private Pagina pagina(Integer pacienteId, Integer nutriId, Integer atendimentoId, int numero) {
        if (numero < 0 || numero > 100000) throw new IllegalArgumentException("Página inválida.");
        var p = exames.listar(pacienteId, nutriId, atendimentoId,
                PageRequest.of(numero, 20, Sort.by(Sort.Direction.DESC, "id")));
        return new Pagina(p.getContent(), numero, p.getTotalPages(), p.getTotalElements());
    }
    @Transactional
    public ExameResponse enviar(Paciente p, Integer id, Long versao, MultipartFile arquivo) {
        Exame e = exames.findByIdAndPaciente_Id(id, p.getId()).orElseThrow(ExameNaoEncontradoException::new);
        versao(e, versao);
        if (!("PENDENTE".equals(e.getStatus()) || "ENVIADO".equals(e.getStatus()))) {
            throw new IllegalArgumentException("O arquivo de um exame analisado não pode ser substituído.");
        }
        if (arquivo == null || arquivo.isEmpty() || arquivo.getSize() > LIMITE_BYTES) {
            throw new IllegalArgumentException("Envie um PDF, PNG ou JPEG não vazio, de até 5 MiB.");
        }
        byte[] bytes;
        try { bytes = arquivo.getBytes(); } catch (IOException ex) { throw new IllegalArgumentException("Não foi possível ler o arquivo."); }
        String tipo = tipo(bytes);
        if (arquivo.getContentType() == null || !tipo.equalsIgnoreCase(arquivo.getContentType())) {
            throw new IllegalArgumentException("O tipo informado não corresponde ao conteúdo do arquivo.");
        }
        String nome = "exame-" + id + extensao(tipo);
        e.enviar(bytes, nome, tipo, LocalDate.now(clock));
        exames.flush();
        return ExameResponse.from(e);
    }
    @Transactional
    public ExameResponse remover(Paciente p, Integer id, Long versao) {
        Exame e = exames.findByIdAndPaciente_Id(id, p.getId()).orElseThrow(ExameNaoEncontradoException::new);
        versao(e, versao);
        if (!"ENVIADO".equals(e.getStatus()))
            throw new IllegalArgumentException("Somente arquivos enviados e ainda não analisados podem ser removidos.");
        e.removerArquivo();
        exames.flush();
        return ExameResponse.from(e);
    }
    @Transactional
    public ExameResponse analisar(Nutricionista n, Integer pacienteId, Integer atendimentoId, Integer id, Analise r) {
        Exame e = exigir(n, pacienteId, atendimentoId, id);
        if (r == null || r.parecer() == null || r.parecer().isBlank() || r.parecer().length() > 5000) {
            throw new IllegalArgumentException("Informe parecer de até 5000 caracteres.");
        }
        versao(e, r.versao());
        if (!"ENVIADO".equals(e.getStatus())) throw new IllegalArgumentException("Somente exames enviados podem ser analisados.");
        e.analisar(r.parecer().trim(), clock.instant()); exames.flush();
        return ExameResponse.from(e);
    }
    @Transactional(readOnly = true)
    public Arquivo arquivo(Nutricionista n, Integer pacienteId, Integer atendimentoId, Integer id) {
        return arquivo(exigir(n, pacienteId, atendimentoId, id));
    }
    @Transactional(readOnly = true)
    public Arquivo arquivo(Paciente p, Integer id) {
        return arquivo(exames.findByIdAndPaciente_Id(id, p.getId()).orElseThrow(ExameNaoEncontradoException::new));
    }
    private void exigirAcessoAoEscopo(Nutricionista n, Integer pacienteId, Integer atendimentoId) {
        if (atendimentoId == null) {
            gestao.exigirAcesso(n, pacienteId);
        } else {
            atendimentos.exigirComRegistro(n, atendimentoId, pacienteId);
        }
    }
    private Exame exigir(Nutricionista n, Integer pacienteId, Integer atendimentoId, Integer id) {
        exigirAcessoAoEscopo(n, pacienteId, atendimentoId);
        return exames.findByIdAndPaciente_IdAndNutricionista_Id(id, pacienteId, n.getId())
                .filter(e -> Objects.equals(e.getConsulta() == null ? null : e.getConsulta().getId(), atendimentoId))
                .orElseThrow(ExameNaoEncontradoException::new);
    }
    private Arquivo arquivo(Exame e) {
        if (e.getArquivo() == null) throw new ExameNaoEncontradoException();
        // Legacy files without validated metadata are not served as active content.
        String tipo = e.getArquivoTipo() == null ? "application/octet-stream" : e.getArquivoTipo();
        return new Arquivo(e.getArquivo(), "exame-" + e.getId() + extensao(tipo), tipo);
    }
    private void versao(Exame e, Long versao) {
        if (versao == null) throw new IllegalArgumentException("Informe a versão do exame.");
        if (e.getVersao() != versao) throw new ConsultaConflitoException("O exame foi alterado. Recarregue antes de continuar.");
    }
    static String tipo(byte[] b) {
        if (b.length >= 5 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F' && b[4] == '-') return "application/pdf";
        if (b.length >= 8 && java.util.Arrays.equals(java.util.Arrays.copyOf(b, 8), new byte[]{(byte)137,80,78,71,13,10,26,10})) return "image/png";
        if (b.length >= 3 && b[0] == (byte)255 && b[1] == (byte)216 && b[2] == (byte)255) return "image/jpeg";
        throw new IllegalArgumentException("Formato inválido. São aceitos somente PDF, PNG e JPEG.");
    }
    private String extensao(String tipo) {
        return switch (tipo) { case "application/pdf" -> ".pdf"; case "image/png" -> ".png"; case "image/jpeg" -> ".jpg"; default -> ".bin"; };
    }
}
