package com.album.seplag.config;

import com.album.seplag.exception.AuthenticationEntryPointImpl;
import com.album.seplag.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.api.base}")
    private String apiBasePath;

    private final JwtConfig jwtConfig;
    private final UserDetailsService userDetailsService;
    private final AuthenticationEntryPointImpl authenticationEntryPoint;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(
            JwtConfig jwtConfig,
            UserDetailsService userDetailsService,
            AuthenticationEntryPointImpl authenticationEntryPoint,
            CorsConfigurationSource corsConfigurationSource) {
        this.jwtConfig = jwtConfig;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Criando o filtro manualmente aqui para evitar o registro automático como Bean do Servlet
        // e eliminar o aviso de Proxy CGLIB sobre métodos 'final'
        JwtAuthenticationFilter jwtAuthenticationFilter = new JwtAuthenticationFilter(jwtConfig, userDetailsService);

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(getAuthWhitelist()).permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private String[] getAuthWhitelist() {
        return new String[]{
            "/v3/api-docs/**",
            "/swagger-ui.html",
            "/swagger-ui/**",
            apiBasePath + "/auth/login",
            apiBasePath + "/auth/register",
            apiBasePath + "/auth/refresh",
            "/actuator/health/**",
            "/csrf",
            "/"
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}