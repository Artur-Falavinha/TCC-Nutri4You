package com.nutri4you.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nutri4you.backend.model.Nutricionista;
import com.nutri4you.backend.model.Paciente;
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
        consultaRepository.save(TestDataFactory.consulta(pacienteVisivel, nutricionista));
    }

    @Test
    void listagemSemTokenRetorna403() throws Exception {
        mockMvc.perform(get("/api/v1/gestao-pacientes"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listagemQ16RetornaApenasPacientesComConsultaOuRelacao() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(get("/api/v1/gestao-pacientes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].email").value("paciente@teste.com"));
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
    void vincularEDesvincularRelacaoRecorrente() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(post("/api/v1/gestao-pacientes/{id}/vincular", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/gestao-pacientes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));

        mockMvc.perform(delete("/api/v1/gestao-pacientes/{id}/relacao", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/gestao-pacientes")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    void detalhePacienteSemAcessoRetorna403() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(get("/api/v1/gestao-pacientes/{id}", pacienteOculto.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void atualizarPacienteComConsultaRetorna200() throws Exception {
        String token = loginComoNutricionista();

        mockMvc.perform(put("/api/v1/gestao-pacientes/{id}", pacienteVisivel.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Paciente Atualizado","telefone":"41977776666"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nome").value("Paciente Atualizado"));
    }

    @Test
    void cadastroNutricionistaPublicoRetorna403() throws Exception {
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
                .andExpect(status().isForbidden());
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
