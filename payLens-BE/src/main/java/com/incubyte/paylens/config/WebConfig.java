package com.incubyte.paylens.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String allowedOrigin;

    public WebConfig(@Value("${paylens.web.cors.allowed-origin:http://localhost:4200}") String allowedOrigin) {
        this.allowedOrigin = allowedOrigin;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigin)
                .allowedMethods("GET", "POST", "PATCH", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept", "Origin")
                .maxAge(3600);
    }
}

