package com.nutri4you.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.BeanDescription;
import tools.jackson.databind.DeserializationConfig;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JacksonModule;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.deser.ValueDeserializerModifier;
import tools.jackson.databind.deser.std.DelegatingDeserializer;
import tools.jackson.databind.ext.javatime.deser.LocalDateDeserializer;
import tools.jackson.databind.ext.javatime.deser.LocalDateTimeDeserializer;
import tools.jackson.databind.module.SimpleModule;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;

@Configuration(proxyBeanMethods = false)
public class FormatoDataConfig {

    public static final String DATA_BRASILEIRA = "dd/MM/uuuu";
    private static final DateTimeFormatter FORMATO_DATA =
            DateTimeFormatter.ofPattern(DATA_BRASILEIRA).withResolverStyle(ResolverStyle.STRICT);
    private static final DateTimeFormatter FORMATO_DATA_HORA =
            DateTimeFormatter.ofPattern(DATA_BRASILEIRA + " HH:mm[:ss]").withResolverStyle(ResolverStyle.STRICT);

    @Bean
    JacksonModule moduloDatasBrasileiras() {
        return new SimpleModule("datas-brasileiras").setDeserializerModifier(new ValueDeserializerModifier() {
            @Override
            public ValueDeserializer<?> modifyDeserializer(
                    DeserializationConfig configuracao,
                    BeanDescription.Supplier descricao,
                    ValueDeserializer<?> padrao) {
                Class<?> tipo = descricao.getBeanClass();
                if (tipo == LocalDate.class) {
                    return new DeserializadorData(padrao, new LocalDateDeserializer(FORMATO_DATA));
                }
                if (tipo == LocalDateTime.class) {
                    return new DeserializadorData(padrao, new LocalDateTimeDeserializer(FORMATO_DATA_HORA));
                }
                return padrao;
            }
        });
    }

    private static final class DeserializadorData extends DelegatingDeserializer {
        private final ValueDeserializer<?> brasileiro;

        private DeserializadorData(ValueDeserializer<?> padrao, ValueDeserializer<?> brasileiro) {
            super(padrao);
            this.brasileiro = brasileiro;
        }

        @Override
        protected ValueDeserializer<?> newDelegatingInstance(ValueDeserializer<?> padrao) {
            return new DeserializadorData(padrao, brasileiro);
        }

        @Override
        public Object deserialize(JsonParser parser, DeserializationContext contexto) {
            if (parser.hasToken(JsonToken.VALUE_STRING) && parser.getString().contains("/")) {
                return brasileiro.deserialize(parser, contexto);
            }
            return super.deserialize(parser, contexto);
        }
    }
}
