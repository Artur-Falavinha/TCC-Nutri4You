package com.nutri4you.backend.service;

import com.nutri4you.backend.dto.AlimentoResponseDTO;
import com.nutri4you.backend.dto.AlimentosPaginadosResponseDTO;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.repository.AlimentoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class AlimentoService {

    private static final Logger log = LoggerFactory.getLogger(AlimentoService.class);
    private static final String CLASSPATH_TACO_CSV = "taco/taco_composicao.csv";

    private final AlimentoRepository alimentoRepository;
    private volatile boolean cargaVerificada = false;

    public AlimentoService(AlimentoRepository alimentoRepository) {
        this.alimentoRepository = alimentoRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void inicializarTabelaTaco() {
        try {
            garantirCargaTaco();
        } catch (Exception ex) {
            log.warn("Não foi possível importar a Tabela TACO na inicialização: {}", ex.getMessage());
        }
    }

    @Transactional
    public synchronized void garantirCargaTaco() {
        if (cargaVerificada && alimentoRepository.count() >= 500) {
            return;
        }
        long existentes = alimentoRepository.count();
        if (existentes >= 597) {
            cargaVerificada = true;
            return;
        }

        try (InputStream is = abrirCsvTaco()) {
            if (is == null) {
                log.warn("Arquivo CSV da Tabela TACO não encontrado.");
                return;
            }
            importarCsv(is);
            cargaVerificada = true;
        } catch (Exception ex) {
            log.error("Erro ao importar CSV da Tabela TACO", ex);
        }
    }

    @Transactional
    public AlimentosPaginadosResponseDTO listarAlimentos(String busca, String categoria, int pagina, int tamanho) {
        garantirCargaTaco();
        int paginaSegura = Math.max(0, pagina);
        int tamanhoSeguro = Math.min(Math.max(1, tamanho), 200);

        String termoBusca = busca == null ? "" : busca.trim();
        String filtroCategoria = categoria == null ? "" : categoria.trim();

        List<Alimento> base;
        if (!filtroCategoria.isEmpty()) {
            base = alimentoRepository.findByCategoriaIgnoreCaseOrderByNomeAsc(filtroCategoria);
        } else {
            base = alimentoRepository.findAllByOrderByNomeAsc();
        }

        String buscaNormalizada = normalizarTexto(termoBusca);
        String[] tokens = buscaNormalizada.isEmpty() ? new String[0] : buscaNormalizada.split("\\s+");

        List<Alimento> filtrados = base.stream()
                .filter(alimento -> correspondeBusca(alimento, buscaNormalizada, tokens))
                .sorted(comparadorRelevancia(buscaNormalizada))
                .toList();

        long totalElementos = filtrados.size();
        int totalPaginas = totalElementos == 0 ? 0 : (int) Math.ceil((double) totalElementos / tamanhoSeguro);
        int inicio = Math.min(paginaSegura * tamanhoSeguro, filtrados.size());
        int fim = Math.min(inicio + tamanhoSeguro, filtrados.size());

        List<AlimentoResponseDTO> itens = filtrados.subList(inicio, fim)
                .stream()
                .map(this::paraDTO)
                .toList();

        return new AlimentosPaginadosResponseDTO(
                itens,
                paginaSegura,
                tamanhoSeguro,
                totalElementos,
                totalPaginas);
    }

    @Transactional
    public List<String> listarCategorias() {
        garantirCargaTaco();
        return alimentoRepository.listarCategorias();
    }

    @Transactional
    public Optional<AlimentoResponseDTO> buscarPorId(Integer id) {
        garantirCargaTaco();
        return alimentoRepository.findById(id).map(this::paraDTO);
    }

    public AlimentoResponseDTO paraDTO(Alimento alimento) {
        return new AlimentoResponseDTO(
                alimento.getId(),
                alimento.getNumeroTaco(),
                alimento.getNome(),
                alimento.getCategoria(),
                alimento.getKcal100g(),
                alimento.getProteina100g(),
                alimento.getCarboidratos100g(),
                alimento.getGordura100g(),
                alimento.getFibra100g());
    }

    private boolean correspondeBusca(Alimento alimento, String buscaNormalizada, String[] tokens) {
        if (buscaNormalizada.isEmpty()) {
            return true;
        }
        String nomeNorm = normalizarTexto(alimento.getNome());
        String catNorm = normalizarTexto(alimento.getCategoria());
        String numeroStr = alimento.getNumeroTaco() == null ? "" : String.valueOf(alimento.getNumeroTaco());

        if (numeroStr.equals(buscaNormalizada)) {
            return true;
        }
        for (String token : tokens) {
            if (!nomeNorm.contains(token) && !catNorm.contains(token)) {
                return false;
            }
        }
        return true;
    }

    private Comparator<Alimento> comparadorRelevancia(String buscaNormalizada) {
        if (buscaNormalizada.isEmpty()) {
            return Comparator.comparing(Alimento::getNome, String.CASE_INSENSITIVE_ORDER);
        }
        return Comparator
                .<Alimento, Integer>comparing(alimento -> {
                    String nomeNorm = normalizarTexto(alimento.getNome());
                    if (nomeNorm.equals(buscaNormalizada)) {
                        return 0;
                    }
                    if (nomeNorm.startsWith(buscaNormalizada)) {
                        return 1;
                    }
                    return 2;
                })
                .thenComparing(Alimento::getNome, String.CASE_INSENSITIVE_ORDER);
    }

    public static String normalizarTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            return "";
        }
        String decomposto = Normalizer.normalize(valor.trim(), Normalizer.Form.NFD);
        return decomposto.replaceAll("\\p{M}", "")
                .replaceAll("[,;-]", " ")
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private InputStream abrirCsvTaco() throws Exception {
        ClassPathResource resource = new ClassPathResource(CLASSPATH_TACO_CSV);
        if (resource.exists()) {
            return resource.getInputStream();
        }
        Path downloadsTaco = Path.of(System.getProperty("user.home", ""), "Downloads", "taco", "data", "processed", "taco", "taco_composicao.csv");
        if (Files.exists(downloadsTaco)) {
            return Files.newInputStream(downloadsTaco);
        }
        return null;
    }

    private void importarCsv(InputStream inputStream) throws Exception {
        Map<Integer, Alimento> porNumero = new HashMap<>();
        for (Alimento existente : alimentoRepository.findAll()) {
            if (existente.getNumeroTaco() != null) {
                porNumero.put(existente.getNumeroTaco(), existente);
            }
        }

        List<Alimento> paraSalvar = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String cabecalhoLinha = reader.readLine();
            if (cabecalhoLinha == null) {
                return;
            }
            List<String> cabecalhos = parseLinhaCsv(removerBom(cabecalhoLinha));
            Map<String, Integer> indices = new HashMap<>();
            for (int i = 0; i < cabecalhos.size(); i++) {
                indices.put(cabecalhos.get(i).trim().toLowerCase(Locale.ROOT), i);
            }

            String linha;
            while ((linha = reader.readLine()) != null) {
                if (linha.isBlank()) {
                    continue;
                }
                List<String> colunas = parseLinhaCsv(linha);
                Integer numeroTaco = parseInteiro(obterColuna(colunas, indices, "numero_alimento"));
                String descricao = obterColuna(colunas, indices, "descricao");
                if (descricao == null || descricao.isBlank()) {
                    continue;
                }

                BigDecimal kcal = parseDecimalNutricional(obterColuna(colunas, indices, "energia_kcal"));
                BigDecimal proteina = parseDecimalNutricional(obterColuna(colunas, indices, "proteina_g"));
                BigDecimal lipideos = parseDecimalNutricional(obterColuna(colunas, indices, "lipideos_g"));
                BigDecimal carboidrato = parseDecimalNutricional(obterColuna(colunas, indices, "carboidrato_g"));
                BigDecimal fibra = parseDecimalNutricional(obterColuna(colunas, indices, "fibra_g"));
                String categoria = textoOpcional(obterColuna(colunas, indices, "categoria"));

                Alimento alimento = numeroTaco != null ? porNumero.get(numeroTaco) : null;
                if (alimento == null) {
                    alimento = new Alimento(
                            numeroTaco,
                            descricao.trim(),
                            categoria,
                            kcal,
                            proteina,
                            carboidrato,
                            lipideos,
                            fibra);
                } else {
                    alimento.setNome(descricao.trim());
                    alimento.setCategoria(categoria);
                    alimento.setKcal100g(kcal);
                    alimento.setProteina100g(proteina);
                    alimento.setCarboidratos100g(carboidrato);
                    alimento.setGordura100g(lipideos);
                    alimento.setFibra100g(fibra);
                }
                paraSalvar.add(alimento);
            }
        }

        if (!paraSalvar.isEmpty()) {
            alimentoRepository.saveAll(paraSalvar);
            log.info("Tabela TACO sincronizada com sucesso: {} alimentos processados.", paraSalvar.size());
        }
    }

    private String removerBom(String valor) {
        if (valor != null && valor.startsWith("\uFEFF")) {
            return valor.substring(1);
        }
        return valor;
    }

    private String obterColuna(List<String> colunas, Map<String, Integer> indices, String nomeColuna) {
        Integer idx = indices.get(nomeColuna);
        if (idx == null || idx < 0 || idx >= colunas.size()) {
            return null;
        }
        return colunas.get(idx);
    }

    private String textoOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }

    private Integer parseInteiro(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(valor.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    static BigDecimal parseDecimalNutricional(String valor) {
        if (valor == null || valor.isBlank()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        String limpo = valor.trim().replace(",", ".");
        try {
            double num = Double.parseDouble(limpo);
            if (Double.isNaN(num) || Double.isInfinite(num) || num <= 0.0001d) {
                return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            }
            return BigDecimal.valueOf(num).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException ex) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
    }

    static List<String> parseLinhaCsv(String linha) {
        List<String> campos = new ArrayList<>();
        StringBuilder atual = new StringBuilder();
        boolean entreAspas = false;

        for (int i = 0; i < linha.length(); i++) {
            char c = linha.charAt(i);
            if (c == '"') {
                if (entreAspas && i + 1 < linha.length() && linha.charAt(i + 1) == '"') {
                    atual.append('"');
                    i++;
                } else {
                    entreAspas = !entreAspas;
                }
            } else if (c == ',' && !entreAspas) {
                campos.add(atual.toString());
                atual.setLength(0);
            } else {
                atual.append(c);
            }
        }
        campos.add(atual.toString());
        return campos;
    }
}

