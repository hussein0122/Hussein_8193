package com.hussein.exam.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
  @Bean
  WebMvcConfigurer corsConfigurer(@Value("${APP_ORIGIN:http://localhost:3000}") String origin) {
    return new WebMvcConfigurer() {
      @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origin).allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS").allowedHeaders("*");
      }
    };
  }
}
