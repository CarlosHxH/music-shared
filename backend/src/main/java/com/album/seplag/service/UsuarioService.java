package com.album.seplag.service;

import com.album.seplag.config.JwtConfig;
import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

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
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

        if (!usuario.getAtivo()) {
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
        try {
            UserDetails userDetails = loadUserByUsername(request.getUsername());

            if (!passwordEncoder.matches(request.getPassword(), userDetails.getPassword())) {
                throw new RuntimeException("Credenciais inválidas");
            }

            String token = jwtConfig.generateToken(userDetails.getUsername());
            return new LoginResponse(token, "Bearer", jwtConfig.getExpiration());
        } catch (UsernameNotFoundException e) {
            throw new RuntimeException("Credenciais inválidas");
        }
    }

    @Transactional
    public LoginResponse refreshToken(String token) {
        String username = jwtConfig.getUsernameFromToken(token);
        
        if (jwtConfig.validateToken(token, username)) {
            // Verificar se o usuário ainda existe
            loadUserByUsername(username);
            String newToken = jwtConfig.generateToken(username);
            return new LoginResponse(newToken, "Bearer", jwtConfig.getExpiration());
        }

        throw new RuntimeException("Token inválido ou expirado");
    }
}

