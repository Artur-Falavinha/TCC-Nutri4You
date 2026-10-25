package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.ItemRefeicaoResponse;
import com.nutri4you.backend.dto.ItemSubstitutoResponse;
import com.nutri4you.backend.dto.ListaComprasResponseDTO;
import com.nutri4you.backend.dto.PlanoAlimentarRequest;
import com.nutri4you.backend.dto.PlanoAlimentarResponse;
import com.nutri4you.backend.dto.RefeicaoResponse;
import com.nutri4you.backend.exception.AcessoNegadoException;
import com.nutri4you.backend.exception.PlanoConflitoException;
import com.nutri4you.backend.exception.PlanoNaoEncontradoException;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.ItemListaCompras;
import com.nutri4you.backend.model.ItemRefeicao;
import com.nutri4you.backend.model.ListaCompras;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.model.Refeicao;
import com.nutri4you.backend.repository.AlimentoRepository;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.ItemListaComprasRepository;
import com.nutri4you.backend.repository.ItemRefeicaoRepository;
import com.nutri4you.backend.repository.ListaComprasRepository;
import com.nutri4you.backend.repository.PlanoAlimentarRepository;
import com.nutri4you.backend.repository.RefeicaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class PlanoAlimentarService {

    private static final ZoneId FUSO_HORARIO = ZoneId.of("America/Sao_Paulo");
    private static final BigDecimal CEM = new BigDecimal("100");
    private static final DateTimeFormatter FORMATO_HORA = DateTimeFormatter.ofPattern("HH:mm");

    private static final List<String> DIAS_SEMANA_ORDEM = List.of(
            "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
    );

    private final PlanoAlimentarRepository planoRepository;
    private final RefeicaoRepository refeicaoRepository;
    private final ItemRefeicaoRepository itemRefeicaoRepository;
    private final AlimentoRepository alimentoRepository;
    private final ConsultaRepository consultaRepository;
    private final ListaComprasRepository listaComprasRepository;
    private final ItemListaComprasRepository itemListaComprasRepository;
    private final GestaoPacienteService gestaoPacienteService;
    private final AlimentoService alimentoService;

    public PlanoAlimentarService(
            PlanoAlimentarRepository planoRepository,
            RefeicaoRepository refeicaoRepository,
            ItemRefeicaoRepository itemRefeicaoRepository,
            AlimentoRepository alimentoRepository,
            ConsultaRepository consultaRepository,
            ListaComprasRepository listaComprasRepository,
            ItemListaComprasRepository itemListaComprasRepository,
            GestaoPacienteService gestaoPacienteService,
            AlimentoService alimentoService) {
        this.planoRepository = planoRepository;
        this.refeicaoRepository = refeicaoRepository;
        this.itemRefeicaoRepository = itemRefeicaoRepository;
        this.alimentoRepository = alimentoRepository;
        this.consultaRepository = consultaRepository;
        this.listaComprasRepository = listaComprasRepository;
        this.itemListaComprasRepository = itemListaComprasRepository;
        this.gestaoPacienteService = gestaoPacienteService;
        this.alimentoService = alimentoService;
    }

    @Transactional(readOnly = true)
    public List<PlanoAlimentarResponse> listarPlanos(Nutricionista nutricionista, Integer pacienteId) {
        gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        return planoRepository.findByPaciente_IdOrderByIdDesc(pacienteId)
                .stream()
                .map(this::montarPlanoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PlanoAlimentarResponse> listarPlanosPaciente(Paciente paciente) {
        return planoRepository.findByPaciente_IdOrderByIdDesc(paciente.getId())
                .stream()
                .map(this::montarPlanoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanoAlimentarResponse buscarPlano(Nutricionista nutricionista, Integer pacienteId, Integer planoId) {
        gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        PlanoAlimentar plano = planoRepository.findByIdAndPaciente_Id(planoId, pacienteId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Plano alimentar não encontrado."));
        return montarPlanoResponse(plano);
    }

    @Transactional(readOnly = true)
    public PlanoAlimentarResponse buscarPlanoPorId(Nutricionista nutricionista, Integer planoId) {
        PlanoAlimentar plano = planoRepository.findById(planoId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Plano alimentar não encontrado."));
        gestaoPacienteService.exigirAcesso(nutricionista, plano.getPaciente().getId());
        return montarPlanoResponse(plano);
    }

    @Transactional(readOnly = true)
    public PlanoAlimentarResponse buscarPlanoPaciente(Paciente paciente, Integer planoId) {
        PlanoAlimentar plano = planoRepository.findByIdAndPaciente_Id(planoId, paciente.getId())
                .orElseThrow(() -> new PlanoNaoEncontradoException("Plano alimentar não encontrado."));
        return montarPlanoResponse(plano);
    }

    @Transactional(readOnly = true)
    public Optional<PlanoAlimentarResponse> buscarDietaAtiva(Nutricionista nutricionista, Integer pacienteId) {
        gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        return localizarPlanoAtivo(pacienteId).map(this::montarPlanoResponse);
    }

    @Transactional(readOnly = true)
    public Optional<PlanoAlimentarResponse> buscarDietaAtivaPaciente(Paciente paciente) {
        return localizarPlanoAtivo(paciente.getId()).map(this::montarPlanoResponse);
    }

    @Transactional
    public PlanoAlimentarResponse criarPlano(
            Nutricionista nutricionista,
            Integer pacienteId,
            PlanoAlimentarRequest request) {
        alimentoService.garantirCargaTaco();
        Paciente paciente = gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        validarVigencia(request);

        PlanoAlimentar plano = new PlanoAlimentar(paciente, nutricionista);
        if (request != null) {
            if (request.consultaId() != null) {
                Consulta consulta = consultaRepository.findById(request.consultaId()).orElse(null);
                if (consulta != null && consulta.getPaciente().getId().equals(pacienteId)) {
                    plano.setConsulta(consulta);
                }
            }
            plano.setTitulo(request.titulo());
            plano.setObservacoes(textoOpcional(request.observacoes()));
            plano.setVigenciaInicio(request.vigenciaInicio() != null
                    ? request.vigenciaInicio()
                    : LocalDate.now(FUSO_HORARIO));
            plano.setVigenciaFim(request.vigenciaFim());
            if (request.metaCalorias() != null) {
                plano.setMetaCalorias(request.metaCalorias());
            }
            if (request.metaProteina() != null) {
                plano.setMetaProteina(request.metaProteina());
            }
            if (request.metaCarboidratos() != null) {
                plano.setMetaCarboidratos(request.metaCarboidratos());
            }
            if (request.metaGordura() != null) {
                plano.setMetaGordura(request.metaGordura());
            }
        } else {
            plano.setVigenciaInicio(LocalDate.now(FUSO_HORARIO));
        }

        plano = planoRepository.save(plano);

        if (request != null && request.refeicoes() != null && !request.refeicoes().isEmpty()) {
            salvarRefeicoesDoRequest(plano, request.refeicoes());
        }

        recalcularMetasDoPlano(plano, request);

        if (request != null && PlanoAlimentar.STATUS_PUBLICADO.equalsIgnoreCase(request.status())) {
            aplicarPublicacao(plano);
        }

        return montarPlanoResponse(plano);
    }

    @Transactional
    public PlanoAlimentarResponse atualizarPlano(
            Nutricionista nutricionista,
            Integer pacienteId,
            Integer planoId,
            PlanoAlimentarRequest request) {
        alimentoService.garantirCargaTaco();
        gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        PlanoAlimentar plano = planoRepository.findByIdAndPaciente_Id(planoId, pacienteId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Plano alimentar não encontrado."));

        if (PlanoAlimentar.STATUS_SUBSTITUIDO.equalsIgnoreCase(plano.getStatus())) {
            throw new PlanoConflitoException("Planos alimentares substituídos fazem parte do histórico e não podem ser alterados.");
        }

        validarVigencia(request);

        if (request != null) {
            if (request.titulo() != null && !request.titulo().isBlank()) {
                plano.setTitulo(request.titulo());
            }
            plano.setObservacoes(textoOpcional(request.observacoes()));
            if (request.vigenciaInicio() != null) {
                plano.setVigenciaInicio(request.vigenciaInicio());
            }
            plano.setVigenciaFim(request.vigenciaFim());

            if (request.refeicoes() != null) {
                limparRefeicoesDoPlano(plano.getId());
                if (!request.refeicoes().isEmpty()) {
                    salvarRefeicoesDoRequest(plano, request.refeicoes());
                }
            }
        }

        recalcularMetasDoPlano(plano, request);

        if (request != null && PlanoAlimentar.STATUS_PUBLICADO.equalsIgnoreCase(request.status())) {
            aplicarPublicacao(plano);
        } else {
            plano = planoRepository.save(plano);
            if (PlanoAlimentar.STATUS_PUBLICADO.equalsIgnoreCase(plano.getStatus())) {
                sincronizarListaComprasInterna(plano);
            }
        }

        return montarPlanoResponse(plano);
    }

    @Transactional
    public PlanoAlimentarResponse publicarPlano(
            Nutricionista nutricionista,
            Integer pacienteId,
            Integer planoId) {
        alimentoService.garantirCargaTaco();
        gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        PlanoAlimentar plano = planoRepository.findByIdAndPaciente_Id(planoId, pacienteId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Plano alimentar não encontrado."));

        if (PlanoAlimentar.STATUS_SUBSTITUIDO.equalsIgnoreCase(plano.getStatus())) {
            throw new PlanoConflitoException("Não é possível publicar um plano já substituído.");
        }

        List<Refeicao> refeicoes = refeicaoRepository.findByPlano_IdOrderByOrdemAscHorarioAscIdAsc(plano.getId());
        if (refeicoes.isEmpty()) {
            throw new IllegalArgumentException("Adicione ao menos uma refeição antes de publicar a dieta.");
        }
        boolean possuiAlgumItem = false;
        for (Refeicao refeicao : refeicoes) {
            List<ItemRefeicao> itens = itemRefeicaoRepository
                    .findByRefeicao_IdAndItemPrincipalIsNullOrderByOrdemAscIdAsc(refeicao.getId());
            if (!itens.isEmpty()) {
                possuiAlgumItem = true;
                break;
            }
        }
        if (!possuiAlgumItem) {
            throw new IllegalArgumentException("Adicione ao menos um alimento em uma refeição antes de publicar a dieta.");
        }

        recalcularMetasDoPlano(plano, null);
        aplicarPublicacao(plano);
        return montarPlanoResponse(plano);
    }

    @Transactional
    public RefeicaoResponse adicionarRefeicao(
            Nutricionista nutricionista,
            Integer planoId,
            PlanoAlimentarRequest.RefeicaoPrescricaoRequest request) {
        alimentoService.garantirCargaTaco();
        PlanoAlimentar plano = planoRepository.findById(planoId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Plano alimentar não encontrado."));
        gestaoPacienteService.exigirAcesso(nutricionista, plano.getPaciente().getId());

        if (request == null || request.nome() == null || request.nome().isBlank()) {
            throw new IllegalArgumentException("Nome da refeição não preenchido corretamente!");
        }

        List<Refeicao> existentes = refeicaoRepository.findByPlano_IdOrderByOrdemAscHorarioAscIdAsc(planoId);
        int ordem = request.ordem() != null ? request.ordem() : existentes.size() + 1;

        Refeicao refeicao = new Refeicao(
                plano,
                request.nome().trim(),
                parseHorario(request.horario()),
                normalizarDiaSemana(request.diaSemana()),
                textoOpcional(request.descricao()),
                ordem);
        refeicao = refeicaoRepository.save(refeicao);

        if (request.itens() != null && !request.itens().isEmpty()) {
            salvarItensDaRefeicao(refeicao, request.itens());
        }

        recalcularMetasDoPlano(plano, null);
        return montarRefeicaoResponse(refeicao);
    }

    @Transactional
    public RefeicaoResponse atualizarRefeicao(
            Nutricionista nutricionista,
            Integer refeicaoId,
            PlanoAlimentarRequest.RefeicaoPrescricaoRequest request) {
        alimentoService.garantirCargaTaco();
        Refeicao refeicao = refeicaoRepository.findById(refeicaoId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Refeição não encontrada."));
        PlanoAlimentar plano = refeicao.getPlano();
        gestaoPacienteService.exigirAcesso(nutricionista, plano.getPaciente().getId());

        if (request == null || request.nome() == null || request.nome().isBlank()) {
            throw new IllegalArgumentException("Nome da refeição não preenchido corretamente!");
        }

        refeicao.setNome(request.nome().trim());
        if (request.diaSemana() != null && !request.diaSemana().isBlank()) {
            refeicao.setDiaSemana(normalizarDiaSemana(request.diaSemana()));
        }
        refeicao.setHorario(parseHorario(request.horario()));
        refeicao.setDescricao(textoOpcional(request.descricao()));
        if (request.ordem() != null) {
            refeicao.setOrdem(request.ordem());
        }
        refeicao = refeicaoRepository.save(refeicao);

        if (request.itens() != null) {
            limparItensDaRefeicao(refeicao.getId());
            if (!request.itens().isEmpty()) {
                salvarItensDaRefeicao(refeicao, request.itens());
            }
        }

        recalcularMetasDoPlano(plano, null);
        return montarRefeicaoResponse(refeicao);
    }

    @Transactional
    public void removerRefeicao(Nutricionista nutricionista, Integer refeicaoId) {
        Refeicao refeicao = refeicaoRepository.findById(refeicaoId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Refeição não encontrada."));
        PlanoAlimentar plano = refeicao.getPlano();
        gestaoPacienteService.exigirAcesso(nutricionista, plano.getPaciente().getId());

        limparItensDaRefeicao(refeicao.getId());
        refeicaoRepository.delete(refeicao);
        recalcularMetasDoPlano(plano, null);
    }

    @Transactional
    public ItemRefeicaoResponse adicionarItemRefeicao(
            Nutricionista nutricionista,
            Integer refeicaoId,
            PlanoAlimentarRequest.ItemPrescricaoRequest request) {
        alimentoService.garantirCargaTaco();
        Refeicao refeicao = refeicaoRepository.findById(refeicaoId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Refeição não encontrada."));
        PlanoAlimentar plano = refeicao.getPlano();
        gestaoPacienteService.exigirAcesso(nutricionista, plano.getPaciente().getId());

        List<ItemRefeicao> existentes = itemRefeicaoRepository
                .findByRefeicao_IdAndItemPrincipalIsNullOrderByOrdemAscIdAsc(refeicaoId);
        int ordem = request != null && request.ordem() != null ? request.ordem() : existentes.size() + 1;

        ItemRefeicao principal = criarItemPrincipalESubstitutos(refeicao, request, ordem);
        recalcularMetasDoPlano(plano, null);
        return montarItemRefeicaoResponse(principal);
    }

    @Transactional
    public ItemRefeicaoResponse atualizarItemRefeicao(
            Nutricionista nutricionista,
            Integer itemId,
            PlanoAlimentarRequest.ItemPrescricaoRequest request) {
        alimentoService.garantirCargaTaco();
        ItemRefeicao item = itemRefeicaoRepository.findById(itemId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Item da refeição não encontrado."));
        Refeicao refeicao = item.getRefeicao();
        PlanoAlimentar plano = refeicao.getPlano();
        gestaoPacienteService.exigirAcesso(nutricionista, plano.getPaciente().getId());

        Alimento alimento = resolverAlimento(
                request != null ? request.alimentoIdEfetivo() : null,
                request != null ? request.nomeAlimento() : null,
                refeicao.getNome());
        BigDecimal gramas = validarQuantidadeGramas(
                request != null ? request.quantidadeGramas() : null,
                alimento.getNome(),
                refeicao.getNome());

        item.setAlimento(alimento);
        item.setQuantidadeGramas(gramas.setScale(2, RoundingMode.HALF_UP));
        if (request != null && request.ordem() != null) {
            item.setOrdem(request.ordem());
        }
        item = itemRefeicaoRepository.save(item);

        if (request != null && request.substitutos() != null && item.getItemPrincipal() == null) {
            List<ItemRefeicao> subsAntigos = itemRefeicaoRepository.findByItemPrincipal_IdOrderByOrdemAscIdAsc(item.getId());
            if (!subsAntigos.isEmpty()) {
                itemRefeicaoRepository.deleteAll(subsAntigos);
            }
            salvarSubstitutos(refeicao, item, request.substitutos());
        }

        recalcularMetasDoPlano(plano, null);
        return montarItemRefeicaoResponse(item);
    }

    @Transactional
    public void removerItemRefeicao(Nutricionista nutricionista, Integer itemId) {
        ItemRefeicao item = itemRefeicaoRepository.findById(itemId)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Item da refeição não encontrado."));
        Refeicao refeicao = item.getRefeicao();
        PlanoAlimentar plano = refeicao.getPlano();
        gestaoPacienteService.exigirAcesso(nutricionista, plano.getPaciente().getId());

        List<ItemRefeicao> substitutos = itemRefeicaoRepository.findByItemPrincipal_IdOrderByOrdemAscIdAsc(item.getId());
        if (!substitutos.isEmpty()) {
            itemRefeicaoRepository.deleteAll(substitutos);
        }
        itemRefeicaoRepository.delete(item);
        recalcularMetasDoPlano(plano, null);
    }

    @Transactional
    public ListaComprasResponseDTO gerarOuBuscarListaCompras(
            Nutricionista nutricionista,
            Integer pacienteId,
            Integer planoIdOpcional) {
        alimentoService.garantirCargaTaco();
        gestaoPacienteService.exigirAcesso(nutricionista, pacienteId);
        PlanoAlimentar plano = resolverPlanoParaListaCompras(pacienteId, planoIdOpcional);
        ListaCompras lista = sincronizarListaComprasInterna(plano);
        return montarListaComprasResponse(lista);
    }

    @Transactional
    public ListaComprasResponseDTO gerarOuBuscarListaComprasPaciente(
            Paciente paciente,
            Integer planoIdOpcional) {
        alimentoService.garantirCargaTaco();
        PlanoAlimentar plano = resolverPlanoParaListaCompras(paciente.getId(), planoIdOpcional);
        ListaCompras lista = sincronizarListaComprasInterna(plano);
        return montarListaComprasResponse(lista);
    }

    @Transactional
    public ListaComprasResponseDTO.ItemListaComprasDTO atualizarItemListaCompras(
            Object principalAutenticado,
            Integer idItemLista,
            Boolean comprado) {
        ItemListaCompras item = itemListaComprasRepository.findById(idItemLista)
                .orElseThrow(() -> new PlanoNaoEncontradoException("Item da lista de compras não encontrado."));
        PlanoAlimentar plano = item.getLista().getPlano();
        Integer pacienteId = plano.getPaciente().getId();

        if (principalAutenticado instanceof Paciente paciente) {
            if (!paciente.getId().equals(pacienteId)) {
                throw new AcessoNegadoException("Sem permissão para alterar esta lista de compras.");
            }
        } else {
            throw new AcessoNegadoException("Apenas o paciente titular pode marcar itens da lista de compras.");
        }

        boolean novoStatus = comprado != null ? comprado : !Boolean.TRUE.equals(item.getComprado());
        item.setComprado(novoStatus);
        item = itemListaComprasRepository.save(item);

        Alimento alimento = item.getAlimento();
        return new ListaComprasResponseDTO.ItemListaComprasDTO(
                item.getId(),
                alimento != null ? alimento.getId() : null,
                item.getNomeItem(),
                item.getCategoria(),
                item.getQuantidade(),
                item.getQuantidadeGramas(),
                Boolean.TRUE.equals(item.getComprado()));
    }

    private PlanoAlimentar resolverPlanoParaListaCompras(Integer pacienteId, Integer planoIdOpcional) {
        if (planoIdOpcional != null) {
            return planoRepository.findByIdAndPaciente_Id(planoIdOpcional, pacienteId)
                    .orElseThrow(() -> new PlanoNaoEncontradoException("Plano alimentar não encontrado."));
        }
        return localizarPlanoAtivo(pacienteId)
                .or(() -> planoRepository.findByPaciente_IdOrderByIdDesc(pacienteId).stream().findFirst())
                .orElseThrow(() -> new PlanoNaoEncontradoException("Nenhum plano alimentar encontrado para o paciente."));
    }

    private Optional<PlanoAlimentar> localizarPlanoAtivo(Integer pacienteId) {
        List<PlanoAlimentar> planos = planoRepository.findByPaciente_IdOrderByIdDesc(pacienteId);
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);
        return planos.stream()
                .filter(p -> PlanoAlimentar.STATUS_PUBLICADO.equalsIgnoreCase(p.getStatus()))
                .filter(p -> p.getVigenciaInicio() == null || !p.getVigenciaInicio().isAfter(hoje))
                .filter(p -> p.getVigenciaFim() == null || !p.getVigenciaFim().isBefore(hoje))
                .findFirst()
                .or(() -> planos.stream()
                        .filter(p -> PlanoAlimentar.STATUS_PUBLICADO.equalsIgnoreCase(p.getStatus()))
                        .findFirst());
    }

    private boolean isPlanoVigente(PlanoAlimentar plano) {
        if (!PlanoAlimentar.STATUS_PUBLICADO.equalsIgnoreCase(plano.getStatus())) {
            return false;
        }
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);
        boolean inicioOk = plano.getVigenciaInicio() == null || !plano.getVigenciaInicio().isAfter(hoje);
        boolean fimOk = plano.getVigenciaFim() == null || !plano.getVigenciaFim().isBefore(hoje);
        return inicioOk && fimOk;
    }

    private void validarVigencia(PlanoAlimentarRequest request) {
        if (request == null) {
            return;
        }
        if (request.vigenciaInicio() != null
                && request.vigenciaFim() != null
                && request.vigenciaFim().isBefore(request.vigenciaInicio())) {
            throw new IllegalArgumentException("A data final de vigência não pode ser anterior à data inicial.");
        }
    }

    private void salvarRefeicoesDoRequest(
            PlanoAlimentar plano,
            List<PlanoAlimentarRequest.RefeicaoPrescricaoRequest> refeicoesRequest) {
        int indice = 1;
        for (PlanoAlimentarRequest.RefeicaoPrescricaoRequest req : refeicoesRequest) {
            if (req == null) {
                continue;
            }
            if (req.nome() == null || req.nome().isBlank()) {
                throw new IllegalArgumentException("Nome da refeição não preenchido corretamente!");
            }
            int ordem = req.ordem() != null ? req.ordem() : indice;
            Refeicao refeicao = new Refeicao(
                    plano,
                    req.nome().trim(),
                    parseHorario(req.horario()),
                    normalizarDiaSemana(req.diaSemana()),
                    textoOpcional(req.descricao()),
                    ordem);
            refeicao = refeicaoRepository.save(refeicao);

            if (req.itens() != null && !req.itens().isEmpty()) {
                salvarItensDaRefeicao(refeicao, req.itens());
            }
            indice++;
        }
    }

    private void salvarItensDaRefeicao(
            Refeicao refeicao,
            List<PlanoAlimentarRequest.ItemPrescricaoRequest> itensRequest) {
        int ordemItem = 1;
        for (PlanoAlimentarRequest.ItemPrescricaoRequest itemReq : itensRequest) {
            if (itemReq == null) {
                continue;
            }
            int ordem = itemReq.ordem() != null ? itemReq.ordem() : ordemItem;
            criarItemPrincipalESubstitutos(refeicao, itemReq, ordem);
            ordemItem++;
        }
    }

    private ItemRefeicao criarItemPrincipalESubstitutos(
            Refeicao refeicao,
            PlanoAlimentarRequest.ItemPrescricaoRequest itemReq,
            int ordem) {
        if (itemReq == null) {
            throw new IllegalArgumentException(
                    "O campo 'Nome do alimento' não foi preenchido na refeição '" + refeicao.getNome() + "'!");
        }
        Alimento alimento = resolverAlimento(itemReq.alimentoIdEfetivo(), itemReq.nomeAlimento(), refeicao.getNome());
        BigDecimal gramas = validarQuantidadeGramas(itemReq.quantidadeGramas(), alimento.getNome(), refeicao.getNome());

        ItemRefeicao principal = new ItemRefeicao(
                refeicao,
                alimento,
                gramas.setScale(2, RoundingMode.HALF_UP),
                null,
                ordem);
        principal = itemRefeicaoRepository.save(principal);

        if (itemReq.substitutos() != null && !itemReq.substitutos().isEmpty()) {
            salvarSubstitutos(refeicao, principal, itemReq.substitutos());
        }
        return principal;
    }

    private void salvarSubstitutos(
            Refeicao refeicao,
            ItemRefeicao principal,
            List<PlanoAlimentarRequest.SubstitutoPrescricaoRequest> substitutos) {
        int ordemSub = 1;
        for (PlanoAlimentarRequest.SubstitutoPrescricaoRequest subReq : substitutos) {
            if (subReq == null) {
                continue;
            }
            Alimento subAlimento = resolverAlimento(subReq.alimentoIdEfetivo(), subReq.nomeAlimento(), refeicao.getNome());
            BigDecimal subGramas = validarQuantidadeGramas(
                    subReq.quantidadeGramas(),
                    subAlimento.getNome(),
                    refeicao.getNome());
            int ordem = subReq.ordem() != null ? subReq.ordem() : ordemSub;

            ItemRefeicao subItem = new ItemRefeicao(
                    refeicao,
                    subAlimento,
                    subGramas.setScale(2, RoundingMode.HALF_UP),
                    principal,
                    ordem);
            itemRefeicaoRepository.save(subItem);
            ordemSub++;
        }
    }

    private Alimento resolverAlimento(Integer idAlimento, String nomeAlimento, String nomeRefeicao) {
        if (idAlimento != null) {
            Optional<Alimento> porId = alimentoRepository.findById(idAlimento);
            if (porId.isPresent()) {
                return porId.get();
            }
        }
        if (nomeAlimento != null && !nomeAlimento.isBlank()) {
            String buscaNorm = AlimentoService.normalizarTexto(nomeAlimento);
            Optional<Alimento> porNome = alimentoRepository.findAll().stream()
                    .filter(a -> AlimentoService.normalizarTexto(a.getNome()).equals(buscaNorm))
                    .findFirst();
            if (porNome.isPresent()) {
                return porNome.get();
            }
        }
        throw new IllegalArgumentException(
                "O campo 'Nome do alimento' não foi preenchido na refeição '" + nomeRefeicao + "'!");
    }

    private BigDecimal validarQuantidadeGramas(BigDecimal quantidadeGramas, String nomeAlimento, String nomeRefeicao) {
        if (quantidadeGramas == null || quantidadeGramas.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "A quantidade de gramas do alimento '" + nomeAlimento + "' não foi preenchida na refeição '" + nomeRefeicao + "'!");
        }
        return quantidadeGramas;
    }

    private void limparRefeicoesDoPlano(Integer planoId) {
        List<Refeicao> refeicoes = refeicaoRepository.findByPlano_IdOrderByOrdemAscHorarioAscIdAsc(planoId);
        for (Refeicao refeicao : refeicoes) {
            limparItensDaRefeicao(refeicao.getId());
        }
        if (!refeicoes.isEmpty()) {
            refeicaoRepository.deleteAll(refeicoes);
            refeicaoRepository.flush();
        }
    }

    private void limparItensDaRefeicao(Integer refeicaoId) {
        List<ItemRefeicao> todosItens = itemRefeicaoRepository.findByRefeicao_IdOrderByOrdemAscIdAsc(refeicaoId);
        if (todosItens.isEmpty()) {
            return;
        }
        List<ItemRefeicao> substitutos = todosItens.stream()
                .filter(i -> i.getItemPrincipal() != null)
                .toList();
        List<ItemRefeicao> principais = todosItens.stream()
                .filter(i -> i.getItemPrincipal() == null)
                .toList();

        if (!substitutos.isEmpty()) {
            itemRefeicaoRepository.deleteAll(substitutos);
            itemRefeicaoRepository.flush();
        }
        if (!principais.isEmpty()) {
            itemRefeicaoRepository.deleteAll(principais);
            itemRefeicaoRepository.flush();
        }
    }

    private void recalcularMetasDoPlano(PlanoAlimentar plano, PlanoAlimentarRequest request) {
        List<Refeicao> refeicoes = refeicaoRepository.findByPlano_IdOrderByOrdemAscHorarioAscIdAsc(plano.getId());
        BigDecimal somaKcal = BigDecimal.ZERO;
        BigDecimal somaProt = BigDecimal.ZERO;
        BigDecimal somaCarb = BigDecimal.ZERO;
        BigDecimal somaGord = BigDecimal.ZERO;
        Set<String> diasComAlimentos = new HashSet<>();
        boolean temItens = false;

        for (Refeicao refeicao : refeicoes) {
            List<ItemRefeicao> principais = itemRefeicaoRepository
                    .findByRefeicao_IdAndItemPrincipalIsNullOrderByOrdemAscIdAsc(refeicao.getId());
            if (!principais.isEmpty()) {
                temItens = true;
                diasComAlimentos.add(normalizarDiaSemana(refeicao.getDiaSemana()));
            }
            for (ItemRefeicao item : principais) {
                Alimento a = item.getAlimento();
                BigDecimal g = item.getQuantidadeGramas();
                somaKcal = somaKcal.add(calcularPorcao(a.getKcal100g(), g));
                somaProt = somaProt.add(calcularPorcao(a.getProteina100g(), g));
                somaCarb = somaCarb.add(calcularPorcao(a.getCarboidratos100g(), g));
                somaGord = somaGord.add(calcularPorcao(a.getGordura100g(), g));
            }
        }

        if (temItens) {
            BigDecimal divisorDias = BigDecimal.valueOf(Math.max(1, diasComAlimentos.size()));
            plano.setMetaCalorias(somaKcal.divide(divisorDias, 2, RoundingMode.HALF_UP));
            plano.setMetaProteina(somaProt.divide(divisorDias, 2, RoundingMode.HALF_UP));
            plano.setMetaCarboidratos(somaCarb.divide(divisorDias, 2, RoundingMode.HALF_UP));
            plano.setMetaGordura(somaGord.divide(divisorDias, 2, RoundingMode.HALF_UP));
        } else if (request != null) {
            if (request.metaCalorias() != null) {
                plano.setMetaCalorias(request.metaCalorias());
            }
            if (request.metaProteina() != null) {
                plano.setMetaProteina(request.metaProteina());
            }
            if (request.metaCarboidratos() != null) {
                plano.setMetaCarboidratos(request.metaCarboidratos());
            }
            if (request.metaGordura() != null) {
                plano.setMetaGordura(request.metaGordura());
            }
        }

        planoRepository.save(plano);
    }

    private void aplicarPublicacao(PlanoAlimentar plano) {
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);
        List<PlanoAlimentar> publicados = planoRepository.findByPaciente_IdAndStatusOrderByIdDesc(
                plano.getPaciente().getId(),
                PlanoAlimentar.STATUS_PUBLICADO);
        for (PlanoAlimentar anterior : publicados) {
            if (!anterior.getId().equals(plano.getId())) {
                anterior.substituir(hoje);
                planoRepository.save(anterior);
            }
        }
        plano.publicar(OffsetDateTime.now(ZoneOffset.UTC), hoje);
        planoRepository.save(plano);
        sincronizarListaComprasInterna(plano);
    }

    private ListaCompras sincronizarListaComprasInterna(PlanoAlimentar plano) {
        LocalDate hoje = LocalDate.now(FUSO_HORARIO);
        ListaCompras lista = listaComprasRepository.findByPlano_Id(plano.getId())
                .map(existente -> {
                    existente.setDataGeracao(hoje);
                    return listaComprasRepository.save(existente);
                })
                .orElseGet(() -> listaComprasRepository.save(new ListaCompras(plano, hoje)));

        List<ItemListaCompras> atuais = itemListaComprasRepository
                .findByLista_IdOrderByCategoriaAscNomeItemAscIdAsc(lista.getId());
        Map<Integer, Boolean> statusCompradoPorAlimento = new HashMap<>();
        for (ItemListaCompras itemAtual : atuais) {
            if (itemAtual.getAlimento() != null) {
                statusCompradoPorAlimento.put(
                        itemAtual.getAlimento().getId(),
                        Boolean.TRUE.equals(itemAtual.getComprado()));
            }
        }
        if (!atuais.isEmpty()) {
            itemListaComprasRepository.deleteAll(atuais);
            itemListaComprasRepository.flush();
        }

        List<Refeicao> refeicoes = refeicaoRepository.findByPlano_IdOrderByOrdemAscHorarioAscIdAsc(plano.getId());
        Map<Integer, Alimento> alimentoMap = new LinkedHashMap<>();
        Map<Integer, BigDecimal> gramasPorAlimento = new LinkedHashMap<>();

        for (Refeicao refeicao : refeicoes) {
            List<ItemRefeicao> principais = itemRefeicaoRepository
                    .findByRefeicao_IdAndItemPrincipalIsNullOrderByOrdemAscIdAsc(refeicao.getId());
            for (ItemRefeicao item : principais) {
                Alimento alimento = item.getAlimento();
                alimentoMap.putIfAbsent(alimento.getId(), alimento);
                gramasPorAlimento.merge(alimento.getId(), item.getQuantidadeGramas(), BigDecimal::add);
            }
        }

        List<ItemListaCompras> novosItens = new ArrayList<>();
        for (Map.Entry<Integer, BigDecimal> entry : gramasPorAlimento.entrySet()) {
            Alimento alimento = alimentoMap.get(entry.getKey());
            BigDecimal totalGramas = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            String quantidadeFormatada = formatarQuantidadeGramas(totalGramas);
            boolean comprado = statusCompradoPorAlimento.getOrDefault(alimento.getId(), false);
            ItemListaCompras novoItem = new ItemListaCompras(
                    lista,
                    alimento,
                    alimento.getNome(),
                    alimento.getCategoria(),
                    quantidadeFormatada,
                    totalGramas);
            novoItem.setComprado(comprado);
            novosItens.add(novoItem);
        }

        if (!novosItens.isEmpty()) {
            itemListaComprasRepository.saveAll(novosItens);
        }
        return lista;
    }

    private ListaComprasResponseDTO montarListaComprasResponse(ListaCompras lista) {
        PlanoAlimentar plano = lista.getPlano();
        List<ItemListaCompras> itens = itemListaComprasRepository
                .findByLista_IdOrderByCategoriaAscNomeItemAscIdAsc(lista.getId());

        List<ListaComprasResponseDTO.ItemListaComprasDTO> itensDto = itens.stream()
                .map(i -> new ListaComprasResponseDTO.ItemListaComprasDTO(
                        i.getId(),
                        i.getAlimento() != null ? i.getAlimento().getId() : null,
                        i.getNomeItem(),
                        i.getCategoria(),
                        i.getQuantidade(),
                        i.getQuantidadeGramas(),
                        Boolean.TRUE.equals(i.getComprado())))
                .toList();

        return new ListaComprasResponseDTO(
                lista.getId(),
                plano.getId(),
                lista.getDataGeracao(),
                itensDto);
    }

    private PlanoAlimentarResponse montarPlanoResponse(PlanoAlimentar plano) {
        List<Refeicao> refeicoes = refeicaoRepository.findByPlano_IdOrderByOrdemAscHorarioAscIdAsc(plano.getId());
        List<RefeicaoResponse> refeicoesResponse = refeicoes.stream()
                .sorted(Comparator
                        .comparingInt((Refeicao r) -> indiceDiaSemana(r.getDiaSemana()))
                        .thenComparing(r -> Optional.ofNullable(r.getOrdem()).orElse(999))
                        .thenComparing(r -> Optional.ofNullable(r.getHorario()).orElse(LocalTime.MAX))
                        .thenComparing(Refeicao::getId))
                .map(this::montarRefeicaoResponse)
                .toList();

        return new PlanoAlimentarResponse(
                plano.getId(),
                plano.getConsulta() != null ? plano.getConsulta().getId() : null,
                plano.getPaciente().getId(),
                plano.getNutricionista().getId(),
                plano.getNutricionista().getNome(),
                plano.getTitulo(),
                plano.getObservacoes(),
                plano.getStatus(),
                isPlanoVigente(plano),
                plano.getVigenciaInicio(),
                plano.getVigenciaFim(),
                plano.getMetaCalorias(),
                plano.getMetaCarboidratos(),
                plano.getMetaGordura(),
                plano.getMetaProteina(),
                plano.getCriadoEm(),
                plano.getPublicadoEm(),
                plano.getVersao(),
                refeicoesResponse);
    }

    private RefeicaoResponse montarRefeicaoResponse(Refeicao refeicao) {
        List<ItemRefeicao> todosItens = itemRefeicaoRepository.findByRefeicao_IdOrderByOrdemAscIdAsc(refeicao.getId());
        Map<Integer, List<ItemRefeicao>> substitutosPorPrincipal = new HashMap<>();
        List<ItemRefeicao> principais = new ArrayList<>();

        for (ItemRefeicao item : todosItens) {
            if (item.getItemPrincipal() == null) {
                principais.add(item);
            } else {
                substitutosPorPrincipal
                        .computeIfAbsent(item.getItemPrincipal().getId(), k -> new ArrayList<>())
                        .add(item);
            }
        }

        List<ItemRefeicaoResponse> itensResponse = new ArrayList<>();
        BigDecimal totalKcal = zero();
        BigDecimal totalProteina = zero();
        BigDecimal totalCarboidratos = zero();
        BigDecimal totalGordura = zero();

        for (ItemRefeicao principal : principais) {
            List<ItemRefeicao> subs = substitutosPorPrincipal.getOrDefault(principal.getId(), List.of());
            ItemRefeicaoResponse itemDto = montarItemRefeicaoResponse(principal, subs);
            itensResponse.add(itemDto);

            totalKcal = totalKcal.add(itemDto.kcalCalculado());
            totalProteina = totalProteina.add(itemDto.proteinaCalculada());
            totalCarboidratos = totalCarboidratos.add(itemDto.carboidratosCalculados());
            totalGordura = totalGordura.add(itemDto.gorduraCalculada());
        }

        String horarioStr = refeicao.getHorario() != null
                ? refeicao.getHorario().format(FORMATO_HORA)
                : "08:00";

        return new RefeicaoResponse(
                refeicao.getId(),
                refeicao.getNome(),
                horarioStr,
                normalizarDiaSemana(refeicao.getDiaSemana()),
                refeicao.getDescricao(),
                refeicao.getOrdem(),
                totalKcal,
                totalProteina,
                totalCarboidratos,
                totalGordura,
                itensResponse);
    }

    private ItemRefeicaoResponse montarItemRefeicaoResponse(ItemRefeicao principal) {
        List<ItemRefeicao> subs = itemRefeicaoRepository.findByItemPrincipal_IdOrderByOrdemAscIdAsc(principal.getId());
        return montarItemRefeicaoResponse(principal, subs);
    }

    private ItemRefeicaoResponse montarItemRefeicaoResponse(ItemRefeicao principal, List<ItemRefeicao> substitutos) {
        Alimento alimento = principal.getAlimento();
        BigDecimal gramas = principal.getQuantidadeGramas();

        List<ItemSubstitutoResponse> subsDto = substitutos.stream()
                .map(sub -> {
                    Alimento sa = sub.getAlimento();
                    BigDecimal sg = sub.getQuantidadeGramas();
                    return new ItemSubstitutoResponse(
                            sub.getId(),
                            sa.getId(),
                            sa.getNumeroTaco(),
                            sa.getNome(),
                            sa.getCategoria(),
                            sg,
                            sa.getKcal100g(),
                            sa.getProteina100g(),
                            sa.getCarboidratos100g(),
                            sa.getGordura100g(),
                            calcularPorcao(sa.getKcal100g(), sg),
                            calcularPorcao(sa.getProteina100g(), sg),
                            calcularPorcao(sa.getCarboidratos100g(), sg),
                            calcularPorcao(sa.getGordura100g(), sg),
                            sub.getOrdem());
                })
                .toList();

        return new ItemRefeicaoResponse(
                principal.getId(),
                alimento.getId(),
                alimento.getNumeroTaco(),
                alimento.getNome(),
                alimento.getCategoria(),
                gramas,
                alimento.getKcal100g(),
                alimento.getProteina100g(),
                alimento.getCarboidratos100g(),
                alimento.getGordura100g(),
                alimento.getFibra100g(),
                calcularPorcao(alimento.getKcal100g(), gramas),
                calcularPorcao(alimento.getProteina100g(), gramas),
                calcularPorcao(alimento.getCarboidratos100g(), gramas),
                calcularPorcao(alimento.getGordura100g(), gramas),
                principal.getOrdem(),
                subsDto);
    }

    public static BigDecimal calcularPorcao(BigDecimal valor100g, BigDecimal gramas) {
        if (valor100g == null || gramas == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return valor100g.multiply(gramas).divide(CEM, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal zero() {
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private String formatarQuantidadeGramas(BigDecimal gramas) {
        if (gramas == null) {
            return "0 g";
        }
        BigDecimal limpo = gramas.stripTrailingZeros();
        return limpo.toPlainString() + " g";
    }

    private String normalizarDiaSemana(String dia) {
        if (dia == null || dia.isBlank()) {
            return "Segunda";
        }
        String limpo = dia.trim().toLowerCase(Locale.ROOT);
        if (limpo.startsWith("seg")) {
            return "Segunda";
        }
        if (limpo.startsWith("ter")) {
            return "Terça";
        }
        if (limpo.startsWith("qua")) {
            return "Quarta";
        }
        if (limpo.startsWith("qui")) {
            return "Quinta";
        }
        if (limpo.startsWith("sex")) {
            return "Sexta";
        }
        if (limpo.startsWith("sab") || limpo.startsWith("sáb")) {
            return "Sábado";
        }
        if (limpo.startsWith("dom")) {
            return "Domingo";
        }
        return dia.trim();
    }

    private int indiceDiaSemana(String dia) {
        String norm = normalizarDiaSemana(dia);
        int idx = DIAS_SEMANA_ORDEM.indexOf(norm);
        return idx >= 0 ? idx : 99;
    }

    private LocalTime parseHorario(String horario) {
        if (horario == null || horario.isBlank()) {
            return LocalTime.of(8, 0);
        }
        String limpo = horario.trim();
        try {
            if (limpo.length() == 5) {
                return LocalTime.parse(limpo, FORMATO_HORA);
            }
            return LocalTime.parse(limpo);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Horário da refeição inválido. Use o formato HH:mm.");
        }
    }

    private String textoOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }
}

