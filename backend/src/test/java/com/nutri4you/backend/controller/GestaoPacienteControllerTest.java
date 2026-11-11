package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
import com.nutri4you.backend.model.RelacaoClinica;
import com.nutri4you.backend.repository.ConsultaRepository;
import com.nutri4you.backend.repository.NutricionistaRepository;
import com.nutri4you.backend.repository.PacienteRepository;
import com.nutri4you.backend.repository.RelacaoClinicaRepository;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class GestaoPacienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NutricionistaRepository nutricionistaRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private RelacaoClinicaRepository relacaoClinicaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Nutricionista nutricionista;
    private Paciente pacienteVisivel;
    private Paciente pacienteOculto;

    @BeforeEach
    void seed() {
        nutricionista = nutricionistaRepository.save(TestDataFactory.nutricionista(passwordEncoder));
        pacienteVisivel = pacienteRepository.save(TestDataFactory.pacienteConfirmado(passwordEncoder));
        pacienteOculto = pacienteRepository.save(TestDataFactory.outroPaciente(passwordEncoder));
        consultaRepository.save(TestDataFactory.consulta(pacienteOculto, nutricionista));
        relacaoClinicaRepository.save(RelacaoClinica.criar(pacienteVisivel, nutricionista));
    }

    @Test
    void listagemSemTokenRetorna401() throws Exception {
        mockMvc.perform(get("/api/v1/gestao-pacientes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listagemRetornaApenasPacientesComRelacaoAtiva() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(get("/api/v1/gestao-pacientes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email").value("paciente@teste.com"))
                .andExpect(jsonPath("$.data[0].relacaoAtiva").value(true));
    }

    @Test
    void buscaPorEmailRetornaResumo() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(get("/api/v1/gestao-pacientes/busca")
                        .param("email", "outro@teste.com")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("outro@teste.com"));
    }

    @Test
    void buscaPorCpfNormalizadoRetornaResumo() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(get("/api/v1/gestao-pacientes/busca")
                        .param("cpf", "98765432100")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nome").value("Outro Paciente"));
    }

    @Test
    void exigeAceiteDoPacienteParaAtivarVinculo() throws Exception {
        String nutricionistaToken = loginComoNutricionista();
        String pacienteToken = loginComoPaciente("outro@teste.com");
        String outroToken = loginComoPaciente("paciente@teste.com");
        String solicitacoes = "/api/v1/usuarios/me/solicitacoes-vinculo";

        solicitarVinculo(nutricionistaToken);
        solicitarVinculo(nutricionistaToken);
        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + nutricionistaToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/usuarios/me/nutricionistas")
                        .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        MvcResult pedido = mockMvc.perform(get(solicitacoes)
                        .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andReturn();
        Number id = JsonPath.read(pedido.getResponse().getContentAsString(), "$.data[0].id");
        Number versao = JsonPath.read(pedido.getResponse().getContentAsString(), "$.data[0].versao");
        String decisao = solicitacoes + "/" + id + "/decisao";
        decidirVinculo(decisao, outroToken, versao, true).andExpect(status().isForbidden());
        decidirVinculo(decisao, pacienteToken, versao, false).andExpect(status().isOk());

        solicitarVinculo(nutricionistaToken);
        decidirVinculo(decisao, pacienteToken, versao, true).andExpect(status().isConflict());
        MvcResult novoPedido = mockMvc.perform(get(solicitacoes)
                        .header("Authorization", "Bearer " + pacienteToken))
                .andExpect(status().isOk()).andReturn();
        Number versaoAtual = JsonPath.read(novoPedido.getResponse().getContentAsString(), "$.data[0].versao");
        decidirVinculo(decisao, pacienteToken, versaoAtual, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(nutricionista.getId()));

        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + nutricionistaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.relacaoAtiva").value(true));
        mockMvc.perform(delete("/api/v1/gestao-pacientes/{id}/relacao", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + nutricionistaToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + nutricionistaToken))
                .andExpect(status().isForbidden());
    }

    private void solicitarVinculo(String token) throws Exception {
        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/vincular", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mensagem").value("Solicitação enviada. Aguarde o aceite do paciente."));
    }

    private org.springframework.test.web.servlet.ResultActions decidirVinculo(
            String rota, String token, Number versao, boolean aceitar) throws Exception {
        return mockMvc.perform(post(rota)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"versao\":" + versao + ",\"aceitar\":" + aceitar + "}"));
    }

    private String loginComoPaciente(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"senha123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.token");
    }

    @Test
    void detalhePacienteSemAcessoRetorna403() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void nutricionistaNaoAlteraDadosPessoaisDoPaciente() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(put("/api/v1/gestao-pacientes/{id}", pacienteVisivel.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Paciente Atualizado","telefone":"41977776666"}
                                """))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void cadastroNutricionistaPublicoRetorna401() throws Exception {
        mockMvc.perform(post("/api/v1/nutricionistas/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Outro Nutri",
                                  "email": "outro.nutri@teste.com",
                                  "senha": "senha123",
                                  "crn": "CRN8-00001"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    private String loginComoNutricionista() throws Exception {
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
