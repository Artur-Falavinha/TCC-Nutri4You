package com.nutri4you.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class RelogioConfig {
    @Bean
    public Clock relogioClinica() { return Clock.system(ZoneId.of("America/Sao_Paulo")); }
}
