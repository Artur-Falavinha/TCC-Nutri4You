package com.nutri4you.backend.controller;

import com.nutri4you.backend.model.*;
import com.nutri4you.backend.repository.*;
import com.nutri4you.backend.security.TokenService;
import com.nutri4you.backend.service.AnamneseCatalog;
import com.nutri4you.backend.support.TestDataFactory;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnamneseControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AnamneseCatalog catalog;
    @Autowired PacienteRepository patients;
    @Autowired NutricionistaRepository nutritionists;
    @Autowired ConsultaRepository consultations;
    @Autowired RelacaoClinicaRepository relations;
    @Autowired PerguntaAnamneseRepository questions;
    @Autowired RespostaAnamneseRepository answers;
    @Autowired AnamneseRepository records;
    @Autowired PasswordEncoder encoder;
    @Autowired TokenService tokens;
    private Paciente patient;
    private Nutricionista nutritionist;
    private String token;
    private String path;

    @BeforeEach void seed() {
        nutritionist = nutritionists.save(TestDataFactory.nutricionista(encoder));
        patient = patients.save(TestDataFactory.pacienteConfirmado(encoder));
        consultations.save(TestDataFactory.consulta(patient, nutritionist));
        token = "Bearer " + tokens.gerarToken(nutritionist.getEmail());
        path = "/api/v1/gestao-pacientes/" + patient.getId() + "/anamnese";
        for (var field : catalog.fields()) {
            var question = new PerguntaAnamnese();
            question.codigo = field.key();
            question.texto = field.label();
            question.categoria = field.section();
            question.tipo = field.type();
            question.ativo = true;
            questions.save(question);
        }
    }

    @Test void noTokenOrPatientRoleCannotReadOrWrite() throws Exception {
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(put(path).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get(path).header("Authorization", "Bearer " + tokens.gerarToken(patient.getEmail())))
            .andExpect(status().isForbidden());
    }

    @Test void unrelatedNutritionistCannotReadOrWrite() throws Exception {
        var other = nutritionists.save(new Nutricionista("Outro", "other@example.test", encoder.encode("secret"), "CRN-OTHER"));
        String otherToken = "Bearer " + tokens.gerarToken(other.getEmail());
        mvc.perform(get(path).header("Authorization", otherToken)).andExpect(status().isForbidden());
        mvc.perform(put(path + "/rascunho").header("Authorization", otherToken)
            .contentType(MediaType.APPLICATION_JSON).content("{\"respostas\":{}}")).andExpect(status().isForbidden());
    }

    @Test void activeRelationWithoutConsultationGrantsAccess() throws Exception {
        consultations.deleteAll();
        relations.save(RelacaoClinica.criar(patient, nutritionist));
        mvc.perform(get(path).header("Authorization", token)).andExpect(status().isOk());
    }

    @Test void startsEmptyWithIdentificationFromDatabase() throws Exception {
        mvc.perform(get(path).header("Authorization", token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("NAO_INICIADA"))
            .andExpect(jsonPath("$.data.paciente.nome").value(patient.getNome()))
            .andExpect(jsonPath("$.data.versao").isEmpty());
        assertEquals(0, records.count());
    }

    @Test void incompleteDraftPersistsAndReloads() throws Exception {
        save(null, Map.of("profession", "Professor"), true).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("RASCUNHO"));
        mvc.perform(get(path).header("Authorization", token))
            .andExpect(jsonPath("$.data.rascunho.profession").value("Professor"));
        assertEquals(0, answers.count());
    }

    @Test void finalizationRequiresApplicableFieldsAndWhitespaceIsEmpty() throws Exception {
        save(null, Map.of("profession", "   "), false).andExpect(status().isUnprocessableContent())
            .andExpect(jsonPath("$.fields.profession").exists())
            .andExpect(jsonPath("$.fields.height").exists())
            .andExpect(jsonPath("$.fields.allergyDetails").doesNotExist());
        assertEquals(0, records.count());
    }

    @Test void validatesTypesOptionsPrecisionAndLimitsEvenInDraft() throws Exception {
        save(null, Map.of("height", 4, "weight", 72.55, "allergy", "Talvez", "profession", List.of("x"),
                "mealsPerDay", 2.5, "phone", "123"), true)
            .andExpect(status().isUnprocessableContent())
            .andExpect(jsonPath("$.fields.height").exists()).andExpect(jsonPath("$.fields.weight").exists())
            .andExpect(jsonPath("$.fields.allergy").exists()).andExpect(jsonPath("$.fields.profession").exists())
            .andExpect(jsonPath("$.fields.mealsPerDay").exists()).andExpect(jsonPath("$.fields.phone").exists());
        save(null, Map.of("profession", "x".repeat(81)), true).andExpect(status().isUnprocessableContent());
    }

    @Test void unknownFieldsAreRejected() throws Exception {
        save(null, Map.of("id_paciente", 999), true).andExpect(status().isUnprocessableContent());
    }

    @Test void noneDiagnosisCannotBeCombinedWithAnother() throws Exception {
        save(null, Map.of("diagnoses", List.of("Nenhum diagnóstico", "Diabetes")), true)
            .andExpect(status().isUnprocessableContent());
    }

    @Test void conditionalFieldsRequiredOnlyWhenApplicable() throws Exception {
        var values = complete();
        values.put("allergy", "Sim");
        values.put("recentExams", "Sim");
        values.put("exam", "Outro");
        values.put("physicalActivity", "Sim");
        save(null, values, false).andExpect(status().isUnprocessableContent())
            .andExpect(jsonPath("$.fields.allergyDetails").exists())
            .andExpect(jsonPath("$.fields.examOther").exists())
            .andExpect(jsonPath("$.fields.activities").exists());
        assertEquals(0, records.count());
    }

    @Test void finalizesAndEditsSameRecordWithoutDuplicateAnswers() throws Exception {
        long version = version(save(null, complete(), false).andExpect(status().isOk()));
        int answerCount = answers.findByPacienteId(patient.getId()).size();
        var changed = complete();
        changed.put("profession", "Nova profissão");
        save(version, changed, false).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("FINALIZADA"))
            .andExpect(jsonPath("$.data.respostas.profession").value("Nova profissão"));
        assertEquals(1, records.count());
        assertEquals(answerCount, answers.count());
    }

    @Test void editingDraftPreservesPublishedAndDiscardRestoresIt() throws Exception {
        long version = version(save(null, complete(), false).andExpect(status().isOk()));
        long draftVersion = version(save(version, Map.of("profession", "Rascunho novo"), true)
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.respostas.profession").value("Sem observações"))
            .andExpect(jsonPath("$.data.rascunho.profession").value("Rascunho novo")));
        mvc.perform(delete(path + "/rascunho").param("versao", String.valueOf(draftVersion)).header("Authorization", token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.rascunho").isEmpty())
            .andExpect(jsonPath("$.data.status").value("FINALIZADA"))
            .andExpect(jsonPath("$.data.respostas.profession").value("Sem observações"));
    }

    @Test void hiddenAnswersAreRemovedIncludingNestedOtherFields() throws Exception {
        var values = complete();
        values.put("allergy", "Sim"); values.put("allergyDetails", "Amendoim");
        long version = version(save(null, values, false).andExpect(status().isOk()));
        values.put("allergy", "Não");
        values.put("exam", "Outro"); values.put("examOther", "Não aplicável");
        save(version, values, false).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.respostas.allergyDetails").doesNotExist())
            .andExpect(jsonPath("$.data.respostas.exam").doesNotExist())
            .andExpect(jsonPath("$.data.respostas.examOther").doesNotExist());
        assertTrue(answers.findByPacienteId(patient.getId()).stream()
            .noneMatch(a -> a.pergunta.codigo.equals("allergyDetails")));
    }

    @Test void staleWritesAndDiscardsReturnConflictWithoutOverwrite() throws Exception {
        long version = version(save(null, Map.of("profession", "Primeiro"), true).andExpect(status().isOk()));
        save(null, Map.of("profession", "Concorrente"), true).andExpect(status().isConflict());
        save(version, Map.of("profession", "Segundo"), true).andExpect(status().isOk());
        save(version, complete(), false).andExpect(status().isConflict());
        mvc.perform(delete(path + "/rascunho").param("versao", String.valueOf(version)).header("Authorization", token))
            .andExpect(status().isConflict());
        mvc.perform(get(path).header("Authorization", token))
            .andExpect(jsonPath("$.data.rascunho.profession").value("Segundo"));
    }

    @Test void draftAfterInitialDiscardUsesNewVersion() throws Exception {
        long version = version(save(null, Map.of(), true).andExpect(status().isOk()));
        mvc.perform(delete(path + "/rascunho").param("versao", String.valueOf(version)).header("Authorization", token))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("NAO_INICIADA"));
        save(version, Map.of(), true).andExpect(status().isConflict());
    }

    @Test void missingPatientAndMalformedBodyHaveAppropriateStatus() throws Exception {
        mvc.perform(get("/api/v1/gestao-pacientes/2147483647/anamnese").header("Authorization", token))
            .andExpect(status().isNotFound());
        mvc.perform(put(path).header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest());
    }

    private Map<String, Object> complete() {
        var result = new LinkedHashMap<String, Object>();
        for (var field : catalog.fields()) {
            if (field.when() != null) continue;
            Object value = switch (field.type()) {
                case "number", "range" -> field.min();
                case "select" -> field.options().contains("Não") ? "Não" : field.options().getFirst();
                case "checkbox" -> List.of(field.options().getFirst());
                case "tel" -> "(41) 99999-9999";
                default -> "Sem observações";
            };
            result.put(field.key(), value);
        }
        return result;
    }

    private ResultActions save(Long version, Map<String, Object> values, boolean draft) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("versao", version); body.put("respostas", values);
        return mvc.perform(put(path + (draft ? "/rascunho" : "")).header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)));
    }

    private long version(ResultActions action) throws Exception {
        JsonNode json = mapper.readTree(action.andReturn().getResponse().getContentAsString());
        return json.path("data").path("versao").asLong();
    }
}
