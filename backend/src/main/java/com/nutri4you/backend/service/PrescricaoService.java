package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.PrescricaoDTO.CompraRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.ItemCompraDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.ItemRefeicaoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.ItemRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.SubstitutoRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.SubstitutoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.ListaComprasDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.Nutrientes;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.PlanoRequest;
import com.nutri4you.backend.dto.PrescricaoDTO.RefeicaoDTO;
import com.nutri4you.backend.dto.PrescricaoDTO.RefeicaoRequest;
import com.nutri4you.backend.exception.PlanoConflitoException;
import com.nutri4you.backend.exception.PlanoNaoEncontradoException;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.model.Consulta;
import com.nutri4you.backend.model.ItemRefeicao;
import com.nutri4you.backend.model.ListaCompras;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.PlanoAlimentar;
import com.nutri4you.backend.model.Refeicao;
import com.nutri4you.backend.repository.AlimentoRepository;
import com.nutri4you.backend.repository.ListaComprasRepository;
import com.nutri4you.backend.repository.PlanoAlimentarRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class PrescricaoService {
    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private final GestaoPacienteService acesso;
    private final AtendimentoClinicoService atendimentos;
    private final PlanoAlimentarRepository planos;
    private final AlimentoRepository alimentos;
    private final ListaComprasRepository listas;
    private final EntityManager entityManager;

    public PrescricaoService(
            GestaoPacienteService acesso,
            AtendimentoClinicoService atendimentos,
            PlanoAlimentarRepository planos,
            AlimentoRepository alimentos,
            ListaComprasRepository listas,
            EntityManager entityManager) {
        this.acesso = acesso;
        this.atendimentos = atendimentos;
        this.planos = planos;
        this.alimentos = alimentos;
        this.listas = listas;
        this.entityManager = entityManager;
    }

    public List<PlanoDTO> listar(Nutricionista autor, Integer pacienteId, Integer atendimentoId) {
        exigirLeitura(autor, pacienteId, atendimentoId);
        return planos
                .listarPorAutor(pacienteId, autor.getId(), atendimentoId)
                .stream()
                .map(this::resposta)
                .toList();
    }

    public PlanoDTO buscar(Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer id) {
        exigirLeitura(autor, pacienteId, atendimentoId);
        return resposta(exigirPlanoNoEscopo(autor, pacienteId, atendimentoId, id));
    }

    @Transactional
    public PlanoDTO criar(Nutricionista autor, Integer pacienteId, Integer atendimentoId, PlanoRequest request) {
        Consulta consulta;
        Paciente paciente;
        Integer consultaId = request == null ? null : request.consultaId();
        if (atendimentoId == null) {
            paciente = acesso.exigirAcesso(autor, pacienteId);
            consulta = consultaLongitudinal(autor, pacienteId, consultaId);
        } else {
            consulta = atendimentos.exigirEmAndamento(autor, atendimentoId, pacienteId);
            validarConsultaDoPlano(consulta, consultaId);
            paciente = consulta.getPaciente();
        }
        if (consulta != null && planos.existsByConsulta_Id(consulta.getId())) {
            throw new PlanoConflitoException("Consulta já possui um plano alimentar.");
        }
        PlanoAlimentar plano = new PlanoAlimentar(paciente, autor, consulta);
        aplicar(plano, request);
        return resposta(planos.saveAndFlush(plano));
    }

    @Transactional
    public PlanoDTO editar(
            Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer id, PlanoRequest request) {
        PlanoAlimentar plano = bloquearPlanoParaEdicao(autor, pacienteId, atendimentoId, id);
        exigirRascunho(plano, request == null ? null : request.versao());
        validarConsultaDoPlano(plano.getConsulta(), request.consultaId());
        aplicar(plano, request);
        return resposta(planos.saveAndFlush(plano));
    }

    @Transactional
    public void excluir(Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer id, Long versao) {
        PlanoAlimentar plano = bloquearPlanoParaEdicao(autor, pacienteId, atendimentoId, id);
        exigirRascunho(plano, versao);
        planos.delete(plano);
        planos.flush();
    }

    @Transactional
    public PlanoDTO publicar(Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer id, Long versao) {
        // O paciente é o recurso comum a todos os autores e deve ser bloqueado antes de consultar a
        // vigência.
        PlanoAlimentar plano = bloquearPlanoParaEdicao(autor, pacienteId, atendimentoId, id);
        exigirRascunho(plano, versao);
        validarPublicacao(plano);
        if (!planos.sobrepostos(pacienteId, plano.getVigenciaInicio(), plano.getVigenciaFim())
                .isEmpty()) {
            throw new PlanoConflitoException(
                    "Já existe um plano publicado com vigência sobreposta para este paciente.");
        }
        plano.publicar();
        return resposta(planos.saveAndFlush(plano));
    }

    public PlanoDTO ativo(Paciente paciente) {
        PlanoAlimentar plano = planoAtivo(paciente);
        return plano == null ? null : resposta(plano);
    }

    public ListaComprasDTO compras(Paciente paciente, int dias) {
        validarDias(dias);
        PlanoAlimentar plano = planoAtivo(paciente);
        return plano == null ? null : respostaCompras(plano, dias);
    }

    public ListaComprasDTO previaCompras(Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer id, int dias) {
        validarDias(dias);
        exigirLeitura(autor, pacienteId, atendimentoId);
        return respostaCompras(exigirPlanoNoEscopo(autor, pacienteId, atendimentoId, id), dias, Map.of());
    }

    @Transactional
    public ListaComprasDTO marcar(Paciente paciente, Integer alimentoId, CompraRequest request) {
        if (request == null
                || request.planoId() == null
                || request.dias() == null
                || request.comprado() == null) {
            throw new IllegalArgumentException("Informe plano, dias e estado da compra.");
        }
        validarDias(request.dias());
        Paciente titular =
                entityManager.find(
                        Paciente.class, paciente.getId(), LockModeType.PESSIMISTIC_WRITE);
        PlanoAlimentar plano = planoAtivo(titular);
        if (plano == null || !plano.getId().equals(request.planoId()))
            throw new PlanoNaoEncontradoException();
        Alimento alimento =
                plano.getRefeicoes().stream()
                        .flatMap(r -> r.getItens().stream())
                        .map(ItemRefeicao::getAlimento)
                        .filter(a -> a.getId().equals(alimentoId))
                        .filter(a -> respostaCompras(plano, request.dias(), Map.of()).itens().stream()
                                .anyMatch(i -> i.alimentoId().equals(alimentoId)))
                        .findFirst()
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "O alimento não pertence ao plano vigente."));
        ListaCompras lista =
                listas.findByPlano_IdAndDias(plano.getId(), request.dias())
                        .orElseGet(() -> new ListaCompras(plano, request.dias()));
        lista.marcar(alimento, request.comprado());
        listas.saveAndFlush(lista);
        return respostaCompras(plano, request.dias());
    }

    @Transactional
    public PlanoDTO salvarRefeicao(Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer planoId, Integer refeicaoId,
            RefeicaoRequest request, Long versao) {
        PlanoAlimentar plano = bloquearPlanoParaEdicao(autor, pacienteId, atendimentoId, planoId);
        exigirRascunho(plano, versao);
        Refeicao nova = montarRefeicao(plano, request);
        if (refeicaoId == null) {
            if (plano.getRefeicoes().size() >= 140) throw new IllegalArgumentException("Limite de 140 refeições por plano.");
            plano.getRefeicoes().add(nova);
        } else {
            Refeicao existente = encontrarRefeicao(plano, refeicaoId);
            existente.getItens().clear();
            entityManager.flush();
            existente.editar(nova.getNome(), nova.getHorario(), nova.getDiaSemana(), List.copyOf(nova.getItens()));
        }
        plano.tocar();
        return resposta(planos.saveAndFlush(plano));
    }

    @Transactional
    public PlanoDTO excluirRefeicao(Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer planoId,
            Integer refeicaoId, Long versao) {
        PlanoAlimentar plano = bloquearPlanoParaEdicao(autor, pacienteId, atendimentoId, planoId);
        exigirRascunho(plano, versao);
        plano.getRefeicoes().remove(encontrarRefeicao(plano, refeicaoId));
        plano.tocar();
        return resposta(planos.saveAndFlush(plano));
    }

    @Transactional
    public PlanoDTO replicarRefeicao(Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer planoId, Integer refeicaoId,
            List<Integer> dias, Long versao) {
        PlanoAlimentar plano = bloquearPlanoParaEdicao(autor, pacienteId, atendimentoId, planoId);
        exigirRascunho(plano, versao);
        Refeicao origem = encontrarRefeicao(plano, refeicaoId);
        if (dias == null || dias.isEmpty() || dias.size() > 6 || new HashSet<>(dias).size() != dias.size()
                || dias.contains(origem.getDiaSemana()) || plano.getRefeicoes().size() + dias.size() > 140
                || dias.stream().anyMatch(d -> d == null || d < 1 || d > 7))
            throw new IllegalArgumentException("Escolha de 1 a 6 dias distintos do dia de origem.");
        for (Integer dia : dias) {
            Refeicao copia = new Refeicao(plano, origem.getNome(), origem.getHorario());
            copia.definirDiaSemana(dia);
            for (ItemRefeicao item : origem.getItens()) {
                ItemRefeicao novo = copia.adicionar(item.getAlimento(), item.getQuantidadeGramas());
                item.getSubstitutos().forEach(s -> novo.adicionarSubstituto(s.getAlimento(), s.getQuantidadeGramas()));
            }
            plano.getRefeicoes().add(copia);
        }
        plano.tocar();
        return resposta(planos.saveAndFlush(plano));
    }

    private Refeicao encontrarRefeicao(PlanoAlimentar plano, Integer id) {
        return plano.getRefeicoes().stream().filter(r -> r.getId().equals(id)).findFirst()
                .orElseThrow(PlanoNaoEncontradoException::new);
    }

    private void exigirLeitura(Nutricionista autor, Integer pacienteId, Integer atendimentoId) {
        if (atendimentoId == null) {
            acesso.exigirAcesso(autor, pacienteId);
        } else {
            atendimentos.exigirComRegistro(autor, atendimentoId, pacienteId);
        }
    }

    private PlanoAlimentar bloquearPlanoParaEdicao(
            Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer id) {
        if (atendimentoId == null) {
            acesso.exigirAcesso(autor, pacienteId);
        } else {
            atendimentos.exigirEmAndamento(autor, atendimentoId, pacienteId);
        }
        entityManager.find(Paciente.class, pacienteId, LockModeType.PESSIMISTIC_WRITE);
        return exigirPlanoNoEscopo(autor, pacienteId, atendimentoId, id);
    }

    private PlanoAlimentar exigirPlanoNoEscopo(
            Nutricionista autor, Integer pacienteId, Integer atendimentoId, Integer id) {
        return planos.findByIdAndPaciente_IdAndNutricionista_Id(id, pacienteId, autor.getId())
                .filter(p -> pertenceAoEscopo(p.getConsulta(), atendimentoId))
                .orElseThrow(PlanoNaoEncontradoException::new);
    }

    private boolean pertenceAoEscopo(Consulta consulta, Integer atendimentoId) {
        if (atendimentoId == null) return consulta == null || !consulta.isAvulsa();
        return consulta != null && atendimentoId.equals(consulta.getId());
    }

    private Consulta consultaLongitudinal(Nutricionista autor, Integer pacienteId, Integer consultaId) {
        if (consultaId == null) return null;
        Consulta consulta = entityManager.find(Consulta.class, consultaId);
        if (consulta == null || consulta.isAvulsa() || !consulta.getPaciente().getId().equals(pacienteId)
                || !consulta.getNutricionista().getId().equals(autor.getId())) {
            throw new IllegalArgumentException("Consulta não pertence a este atendimento.");
        }
        return consulta;
    }

    private void validarConsultaDoPlano(Consulta consulta, Integer consultaId) {
        if (consultaId != null && (consulta == null || !consultaId.equals(consulta.getId()))) {
            throw new IllegalArgumentException("Consulta não pertence a este atendimento.");
        }
    }

    private void exigirRascunho(PlanoAlimentar plano, Long versao) {
        if (versao == null || versao < 0)
            throw new IllegalArgumentException("Informe a versão atual do plano.");
        if (!versao.equals(plano.getVersao()))
            throw new PlanoConflitoException(
                    "O plano foi alterado. Recarregue antes de continuar.");
        if (!"RASCUNHO".equals(plano.getStatus()))
            throw new PlanoConflitoException(
                    "Somente rascunhos podem ser alterados, excluídos ou publicados.");
    }

    private void aplicar(PlanoAlimentar plano, PlanoRequest request) {
        if (request == null) throw new IllegalArgumentException("Informe os dados do plano.");
        validarTexto(request.titulo(), 150, "Título");
        if (request.orientacoes() != null && request.orientacoes().length() > 4000)
            throw new IllegalArgumentException("Orientações devem ter até 4000 caracteres.");
        if (request.vigenciaInicio() != null
                && request.vigenciaFim() != null
                && request.vigenciaFim().isBefore(request.vigenciaInicio())) {
            throw new IllegalArgumentException(
                    "O fim da vigência deve ser igual ou posterior ao início.");
        }
        validarMetas(request.metas());
        if (request.refeicoes() == null || request.refeicoes().size() > 140)
            throw new IllegalArgumentException("Informe de 0 a 140 refeições.");
        List<Refeicao> novas =
                request.refeicoes().stream().map(r -> montarRefeicao(plano, r)).toList();
        plano.editar(
                request.titulo().trim(),
                request.orientacoes(),
                request.vigenciaInicio(),
                request.vigenciaFim(),
                request.metas());
        plano.getRefeicoes().clear();
        plano.getRefeicoes().addAll(novas);
    }

    Refeicao montarRefeicao(PlanoAlimentar plano, RefeicaoRequest request) {
        if (request == null) throw new IllegalArgumentException("Refeição inválida.");
        validarTexto(request.nome(), 100, "Nome da refeição");
        if (request.diaSemana() != null && (request.diaSemana() < 1 || request.diaSemana() > 7))
            throw new IllegalArgumentException("Dia da semana deve estar entre 1 e 7.");
        if (request.horario() == null
                || request.horario().getSecond() != 0
                || request.horario().getNano() != 0) {
            throw new IllegalArgumentException("Informe horário da refeição em horas e minutos.");
        }
        if (request.itens() == null || request.itens().size() > 100)
            throw new IllegalArgumentException("Informe de 0 a 100 alimentos por refeição.");
        Refeicao refeicao = new Refeicao(plano, request.nome().trim(), request.horario());
        refeicao.definirDiaSemana(request.diaSemana());
        Set<Integer> ids = new HashSet<>();
        for (ItemRequest item : request.itens()) {
            if (item == null || item.alimentoId() == null || !ids.add(item.alimentoId()))
                throw new IllegalArgumentException(
                        "Alimentos devem ser válidos e não podem se repetir na mesma refeição.");
            Alimento alimento = exigirAlimento(item.alimentoId(), item.quantidadeGramas());
            ItemRefeicao principal = refeicao.adicionar(alimento, item.quantidadeGramas());
            adicionarSubstitutos(principal, item);
        }
        return refeicao;
    }

    private Alimento exigirAlimento(Integer alimentoId, BigDecimal gramas) {
        validarNumero(gramas, new BigDecimal("10000"), false, "Quantidade em gramas");
        if (alimentoId == null) throw new IllegalArgumentException("Alimento inválido.");
        Alimento alimento = alimentos.findById(alimentoId)
                .orElseThrow(() -> new IllegalArgumentException("Alimento não encontrado."));
        if (!alimento.calculavel())
            throw new IllegalArgumentException("Alimento sem dados nutricionais calculáveis para prescrição.");
        return alimento;
    }

    private void adicionarSubstitutos(ItemRefeicao principal, ItemRequest request) {
        if (request.substitutos().size() > 10)
            throw new IllegalArgumentException("Informe no máximo 10 substitutos por alimento.");
        Set<Integer> ids = new HashSet<>();
        ids.add(request.alimentoId());
        for (SubstitutoRequest substituto : request.substitutos()) {
            if (substituto == null || substituto.alimentoId() == null || !ids.add(substituto.alimentoId()))
                throw new IllegalArgumentException("Substitutos não podem se repetir nem ser o alimento principal.");
            Alimento alimento = exigirAlimento(substituto.alimentoId(), substituto.quantidadeGramas());
            principal.adicionarSubstituto(alimento, substituto.quantidadeGramas());
        }
    }

    private void validarTexto(String texto, int limite, String campo) {
        if (texto == null || texto.isBlank() || texto.trim().length() > limite)
            throw new IllegalArgumentException(
                    campo + " deve ter entre 1 e " + limite + " caracteres.");
    }

    private void validarMetas(Nutrientes metas) {
        if (metas == null) return;
        validarNumero(metas.kcal(), new BigDecimal("999999.99"), false, "Meta de calorias");
        validarNumero(metas.proteinas(), new BigDecimal("999999.99"), true, "Meta de proteínas");
        validarNumero(
                metas.carboidratos(), new BigDecimal("999999.99"), true, "Meta de carboidratos");
        validarNumero(metas.gorduras(), new BigDecimal("999999.99"), true, "Meta de gorduras");
    }

    private void validarNumero(
            BigDecimal valor, BigDecimal limite, boolean aceitaZero, String campo) {
        if (valor == null
                || valor.signum() < 0
                || !aceitaZero && valor.signum() == 0
                || valor.compareTo(limite) > 0
                || valor.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException(
                    campo + " fora dos limites permitidos ou com mais de duas casas decimais.");
        }
    }

    void validarPublicacao(PlanoAlimentar plano) {
        if (plano.getVigenciaInicio() == null || plano.getVigenciaFim() == null)
            throw new IllegalArgumentException(
                    "Publicação exige início e fim da vigência explícitos.");
        if (plano.getRefeicoes().isEmpty()
                || plano.getRefeicoes().stream()
                        .anyMatch(
                                r ->
                                        r.getItens().isEmpty()
                                                || r.getItens().stream()
                                                        .anyMatch(
                                                                i ->
                                                                        !i.calculavel()
                                                                                || !i.getAlimento()
                                                                                        .calculavel()
                                                                                || i.getSubstitutos().stream()
                                                                                        .anyMatch(s -> !s.getAlimento().calculavel())))) {
            throw new IllegalArgumentException(
                    "Publicação exige refeições com alimentos e nutrientes calculáveis.");
        }
    }

    private PlanoAlimentar planoAtivo(Paciente paciente) {
        LocalDate hoje = LocalDate.now(FUSO);
        return planos.sobrepostos(paciente.getId(), hoje, hoje).stream().findFirst().orElse(null);
    }

    private boolean dentroDaVigencia(PlanoAlimentar plano, LocalDate data) {
        return (plano.getVigenciaInicio() == null || !data.isBefore(plano.getVigenciaInicio()))
                && (plano.getVigenciaFim() == null || !data.isAfter(plano.getVigenciaFim()));
    }

    private void validarDias(int dias) {
        if (dias < 1 || dias > 30)
            throw new IllegalArgumentException(
                    "O período de compras deve ficar entre 1 e 30 dias.");
    }

    private Nutrientes totalRefeicao(Refeicao refeicao) {
        return refeicao.getItens().stream()
                .filter(ItemRefeicao::calculavel)
                .map(ItemRefeicao::nutrientes)
                .reduce(Nutrientes.zero(), Nutrientes::somar);
    }

    private PlanoDTO resposta(PlanoAlimentar plano) {
        List<RefeicaoDTO> refeicoes =
                plano.getRefeicoes().stream()
                        .sorted(
                                Comparator.comparing(Refeicao::getDiaSemana, Comparator.nullsFirst(Comparator.naturalOrder()))
                                        .thenComparing(Refeicao::getHorario)
                                        .thenComparing(Refeicao::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(
                                r ->
                                        new RefeicaoDTO(
                                                r.getId(),
                                                r.getNome(),
                                                r.getHorario(),
                                                r.getDiaSemana(),
                                                r.getItens().stream()
                                                        .map(
                                                                i ->
                                                                        new ItemRefeicaoDTO(
                                                                                i.getAlimento()
                                                                                        .paraResposta(),
                                                                                i
                                                                                        .getQuantidadeGramas(),
                                                                                i.calculavel()
                                                                                        ? i.nutrientes()
                                                                                                .arredondar()
                                                                                        : Nutrientes
                                                                                                .zero()
                                                                                                .arredondar(),
                                                                                i.getSubstitutos().stream()
                                                                                        .map(s -> new SubstitutoDTO(s.getAlimento().paraResposta(), s.getQuantidadeGramas(), s.nutrientes().arredondar()))
                                                                                        .toList()))
                                                        .toList(),
                                                totalRefeicao(r).arredondar()))
                        .toList();
        Nutrientes totais =
                plano.getRefeicoes().stream()
                        .filter(r -> r.previstaEm(LocalDate.now(FUSO)))
                        .map(this::totalRefeicao)
                        .reduce(Nutrientes.zero(), Nutrientes::somar)
                        .arredondar();
        Nutrientes metas =
                plano.getMetaCalorias() == null
                        ? null
                        : new Nutrientes(
                                plano.getMetaCalorias(),
                                plano.getMetaProteina(),
                                plano.getMetaCarboidratos(),
                                plano.getMetaGordura());
        return new PlanoDTO(
                plano.getId(),
                plano.getPaciente().getId(),
                plano.getNutricionista().getId(),
                plano.getNutricionista().getNome(),
                plano.getTitulo(),
                plano.getOrientacoes(),
                plano.getStatus(),
                plano.getVersao(),
                plano.getVigenciaInicio(),
                plano.getVigenciaFim(),
                plano.getPublicadoEm(),
                metas,
                totais,
                refeicoes,
                plano.getConsulta() == null ? null : plano.getConsulta().getId());
    }

    private ListaComprasDTO respostaCompras(PlanoAlimentar plano, int dias) {
        Map<Integer, Boolean> marcacoes = new HashMap<>();
        listas.findByPlano_IdAndDias(plano.getId(), dias)
                .ifPresent(
                        l ->
                                l.getItens().stream()
                                        .filter(i -> i.getAlimento() != null)
                                        .forEach(
                                                i ->
                                                        marcacoes.put(
                                                                i.getAlimento().getId(),
                                                                i.isComprado())));
        return respostaCompras(plano, dias, marcacoes);
    }

    private ListaComprasDTO respostaCompras(PlanoAlimentar plano, int dias, Map<Integer, Boolean> marcacoes) {
        Map<Integer, BigDecimal> gramas = new LinkedHashMap<>();
        Map<Integer, Alimento> catalogo = new HashMap<>();
        LocalDate hoje = LocalDate.now(FUSO);
        plano.getRefeicoes()
                .forEach(
                        r ->
                                r.getItens()
                                        .forEach(
                                                i -> {
                                                    long ocorrencias = hoje.datesUntil(hoje.plusDays(dias))
                                                            .filter(data -> dentroDaVigencia(plano, data) && r.previstaEm(data)).count();
                                                    if (ocorrencias == 0) return;
                                                    Integer id = i.getAlimento().getId();
                                                    catalogo.put(id, i.getAlimento());
                                                    gramas.merge(
                                                            id,
                                                            i.getQuantidadeGramas()
                                                                    .multiply(
                                                                            BigDecimal.valueOf(
                                                                                    ocorrencias)),
                                                            BigDecimal::add);
                                                }));
        List<ItemCompraDTO> itens =
                gramas.entrySet().stream()
                        .map(
                                e ->
                                        new ItemCompraDTO(
                                                e.getKey(),
                                                catalogo.get(e.getKey()).getNome(),
                                                catalogo.get(e.getKey()).getCategoria(),
                                                e.getValue().setScale(2, RoundingMode.HALF_UP),
                                                marcacoes.getOrDefault(e.getKey(), false)))
                        .sorted(
                                Comparator.comparing(ItemCompraDTO::nome)
                                        .thenComparing(ItemCompraDTO::alimentoId))
                        .toList();
        int comprados = (int) itens.stream().filter(ItemCompraDTO::comprado).count();
        return new ListaComprasDTO(
                plano.getId(),
                plano.getTitulo(),
                dias,
                itens.size(),
                comprados,
                itens.size() - comprados,
                itens);
    }
}
