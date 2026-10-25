package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Alimento;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.repository.AlimentoRepository;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PlanoAlimentarControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private NutricionistaRepository nutricionistaRepository;
    @Autowired
    private PacienteRepository pacienteRepository;
    @Autowired
    private ConsultaRepository consultaRepository;
    @Autowired
    private AlimentoRepository alimentoRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private Paciente paciente;

    @BeforeEach
    void seed() {
        Nutricionista nutricionista = nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
        paciente = pacienteRepository.save(TestDataFactory.pacienteConfirmado(passwordEncoder));
        consultaRepository.save(TestDataFactory.consulta(paciente, nutricionista));
    }

    @Test
    void importaTabelaTacoEPermiteBuscaPorNomeECategoria() throws Exception {
        String token = loginNutri();

        mockMvc.perform(get("/api/v1/alimentos")
                        .param("busca", "arroz")
                        .param("tamanho", "10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItens", greaterThanOrEqualTo(5)))
                .andExpect(jsonPath("$.data.itens[0].nome").exists())
                .andExpect(jsonPath("$.data.itens[0].kcal100g").exists());

        mockMvc.perform(get("/api/v1/alimentos/categorias")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(15)));
    }

    @Test
    void criaPrescricaoComSubstitutosCalculaMacrosPublicaEGeraListaCompras() throws Exception {
        String token = loginNutri();

        // Garante carga TACO
        mockMvc.perform(get("/api/v1/alimentos").param("tamanho", "5")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        Alimento arroz = alimentoRepository.findByNumeroTaco(1).orElseThrow();
        Alimento aveia = alimentoRepository.findByNumeroTaco(5).orElseThrow();

        String payloadPlano1 = """
                {
                  "titulo": "Dieta Fase 1",
                  "status": "PUBLICADO",
                  "refeicoes": [
                    {
                      "nome": "Almoço",
                      "horario": "12:30",
                      "diaSemana": "Segunda",
                      "itens": [
                        {
                          "alimentoId": %d,
                          "quantidadeGramas": 150,
                          "substitutos": [
                            {
                              "alimentoId": %d,
                              "quantidadeGramas": 50
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
                """.formatted(arroz.getId(), aveia.getId());

        MvcResult res1 = mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadPlano1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PUBLICADO"))
                .andExpect(jsonPath("$.data.refeicoes", hasSize(1)))
                .andExpect(jsonPath("$.data.refeicoes[0].itens", hasSize(1)))
                .andExpect(jsonPath("$.data.refeicoes[0].itens[0].substitutos", hasSize(1)))
                .andReturn();

        Integer idPlano1 = JsonPath.read(res1.getResponse().getContentAsString(), "$.data.id");

        // Verifica lista de compras consolidada
        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/listas-compras", paciente.getId())
                        .param("idPlano", String.valueOf(idPlano1))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.itens", hasSize(1)))
                .andExpect(jsonPath("$.data.itens[0].quantidade").value("150 g"));

        // Publica um segundo plano e verifica que o primeiro foi SUBSTITUIDO
        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadPlano1.replace("Dieta Fase 1", "Dieta Fase 2")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PUBLICADO"));

        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}/planos/{planoId}", paciente.getId(), idPlano1)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUBSTITUIDO"));
    }

    @Test
    void validaCamposObrigatoriosDeRefeicaoEAlimentoConformeHU012() throws Exception {
        String token = loginNutri();

        mockMvc.perform(get("/api/v1/alimentos").param("tamanho", "2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        Alimento arroz = alimentoRepository.findByNumeroTaco(1).orElseThrow();

        // 1. Nome da refeição em branco
        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refeicoes": [{"nome": "   ", "diaSemana": "Segunda", "itens": []}]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Nome da refeição não preenchido corretamente!"));

        // 2. Alimento não selecionado na refeição
        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refeicoes": [
                                    {
                                      "nome": "Almoço",
                                      "diaSemana": "Segunda",
                                      "itens": [{"quantidadeGramas": 100}]
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O campo 'Nome do alimento' não foi preenchido na refeição 'Almoço'!"));

        // 3. Quantidade de gramas não preenchida
        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/planos", paciente.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refeicoes": [
                                    {
                                      "nome": "Almoço",
                                      "diaSemana": "Segunda",
                                      "itens": [{"alimentoId": %d, "quantidadeGramas": 0}]
                                    }
                                  ]
                                }
                                """.formatted(arroz.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "A quantidade de gramas do alimento '" + arroz.getNome() + "' não foi preenchida na refeição 'Almoço'!"));
    }

    private String loginNutri() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nutri@teste.com","senha":"senha123"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.token");
    }
}

