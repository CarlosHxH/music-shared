package com.album.seplag.service;

import com.album.seplag.config.JwtConfig;
import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.dto.UsuarioRegisterDTO;
import com.album.seplag.exception.InvalidCredentialsException;
import com.album.seplag.exception.InvalidTokenException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());
            String accessToken = jwtConfig.generateAccessToken(userDetails.getUsername(), roles);
            String refreshToken = jwtConfig.generateRefreshToken(userDetails.getUsername());
            usuarioService.atualizarLastLogin(request.username());
            log.info("Login bem-sucedido para usuário: {}", request.username());
            return new LoginResponse(accessToken, refreshToken, jwtConfig.getExpiration());
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

            if (!jwtConfig.validateRefreshToken(token, username)) {
                log.info("Refresh token inválido ou expirado");
                throw new InvalidTokenException();
            }

            var usuario = usuarioService.findByUsername(username);
            List<String> roles = usuario.roles() != null ? List.copyOf(usuario.roles()) : List.of();
            String newAccessToken = jwtConfig.generateAccessToken(username, roles);
            String newRefreshToken = jwtConfig.generateRefreshToken(username);
            log.info("Token renovado com sucesso para usuário: {}", username);
            return new LoginResponse(newAccessToken, newRefreshToken, jwtConfig.getExpiration());
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
        List<String> roles = List.of("ROLE_USER");
        String accessToken = jwtConfig.generateAccessToken(dto.username(), roles);
        String refreshToken = jwtConfig.generateRefreshToken(dto.username());
        log.info("Registro e login automático para usuário: {}", dto.username());
        return new LoginResponse(accessToken, refreshToken, jwtConfig.getExpiration());
    }
}
