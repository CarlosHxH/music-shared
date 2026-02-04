package com.album.seplag.service;

import com.album.seplag.config.JwtConfig;
import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.dto.UsuarioRegisterDTO;
import com.album.seplag.exception.InvalidCredentialsException;
import com.album.seplag.exception.InvalidTokenException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthService {

    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtConfig jwtConfig;
    private final UsuarioService usuarioService;

    public AuthService(UserDetailsService userDetailsService,
                      PasswordEncoder passwordEncoder,
                      JwtConfig jwtConfig,
                      UsuarioService usuarioService) {
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.jwtConfig = jwtConfig;
        this.usuarioService = usuarioService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        log.info("Tentativa de login para usuário: {}", request.username());
        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());

            if (!passwordEncoder.matches(request.password(), userDetails.getPassword())) {
                log.info("Senha inválida para usuário: {}", request.username());
                throw new InvalidCredentialsException();
            }

            String token = jwtConfig.generateToken(userDetails.getUsername());
            usuarioService.atualizarLastLogin(request.username());
            log.info("Login bem-sucedido para usuário: {}", request.username());
            return new LoginResponse(token, "Bearer", jwtConfig.getExpiration());
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            log.info("Falha no login - usuário não encontrado: {}", request.username());
            throw new InvalidCredentialsException();
        }
    }

    @Transactional(readOnly = true)
    public LoginResponse refreshToken(String token) {
        log.info("Renovando token JWT");
        try {
            String username = jwtConfig.getUsernameFromToken(token);

            if (!jwtConfig.validateToken(token, username)) {
                log.info("Token inválido ou expirado");
                throw new InvalidTokenException();
            }

            userDetailsService.loadUserByUsername(username);
            String newToken = jwtConfig.generateToken(username);
            log.info("Token renovado com sucesso para usuário: {}", username);
            return new LoginResponse(newToken, "Bearer", jwtConfig.getExpiration());
        } catch (InvalidTokenException e) {
            throw e;
        } catch (Exception e) {
            log.info("Erro ao renovar token: {}", e.getMessage(), e);
            throw new InvalidTokenException();
        }
    }

    @Transactional
    public LoginResponse register(UsuarioRegisterDTO dto) {
        usuarioService.register(dto);
        usuarioService.atualizarLastLogin(dto.username());
        String token = jwtConfig.generateToken(dto.username());
        log.info("Registro e login automático para usuário: {}", dto.username());
        return new LoginResponse(token, "Bearer", jwtConfig.getExpiration());
    }
}
