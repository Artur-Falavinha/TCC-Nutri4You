package com.nutri4you.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DevEmailPreviewSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void previewForaDoPerfilDevExigeAutenticacao() throws Exception {
        mockMvc.perform(get("/api/v1/dev/email-preview/{token}", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }
}
