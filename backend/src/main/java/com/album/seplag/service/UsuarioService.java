package com.album.seplag.service;

import com.album.seplag.config.JwtConfig;
import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Slf4j
@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtConfig jwtConfig;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtConfig jwtConfig) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtConfig = jwtConfig;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("Carregando usuário: {}", username);
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.info("Usuário não encontrado: {}", username);
                    return new UsernameNotFoundException("Usuário não encontrado: " + username);
                });

        if (!usuario.getAtivo()) {
            log.info("Tentativa de login com usuário inativo: {}", username);
            throw new UsernameNotFoundException("Usuário inativo: " + username);
        }

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword())
                .roles(usuario.getRoles().stream()
                        .map(role -> role.replace("ROLE_", ""))
                        .collect(Collectors.joining(",")))
                .build();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        log.info("Tentativa de login para usuário: {}", request.username());
        try {
            UserDetails userDetails = loadUserByUsername(request.username());

            if (!passwordEncoder.matches(request.password(), userDetails.getPassword())) {
                log.info("Senha inválida para usuário: {}", request.username());
                throw new RuntimeException("Credenciais inválidas");
            }

            String token = jwtConfig.generateToken(userDetails.getUsername());
            log.info("Login bem-sucedido para usuário: {}", request.username());
            return new LoginResponse(token, "Bearer", jwtConfig.getExpiration());
        } catch (UsernameNotFoundException e) {
            log.info("Falha no login - usuário não encontrado: {}", request.username());
            throw new RuntimeException("Credenciais inválidas");
        }
    }

    @Transactional
    public LoginResponse refreshToken(String token) {
        log.info("Renovando token JWT");
        try {
            String username = jwtConfig.getUsernameFromToken(token);
            
            if (jwtConfig.validateToken(token, username)) {
                // Verificar se o usuário ainda existe
                loadUserByUsername(username);
                String newToken = jwtConfig.generateToken(username);
                log.info("Token renovado com sucesso para usuário: {}", username);
                return new LoginResponse(newToken, "Bearer", jwtConfig.getExpiration());
            }

            log.info("Token inválido ou expirado");
            throw new RuntimeException("Token inválido ou expirado");
        } catch (Exception e) {
            log.info("Erro ao renovar token: {}", e.getMessage(), e);
            throw new RuntimeException("Token inválido ou expirado", e);
        }
    }
}

