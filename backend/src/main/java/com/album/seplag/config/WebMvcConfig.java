package com.album.seplag.config;

import com.album.seplag.enums.SortDirection;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;

    @Value("${app.api.base}")
    private String basePath;

    public WebMvcConfig(RateLimitInterceptor rateLimitInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToSortDirectionConverter());
    }

    private static class StringToSortDirectionConverter implements Converter<String, SortDirection> {
        @Override
        public SortDirection convert(String source) {
            if (source == null || source.isBlank()) return SortDirection.ASC;
            return SortDirection.valueOf(source.trim().toUpperCase());
        }
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns(basePath + "/**")
                .excludePathPatterns(basePath + "/auth/**", "/actuator/**", "/swagger-ui/**", "/v3/api-docs/**", "/api-docs/**");
    }

}
