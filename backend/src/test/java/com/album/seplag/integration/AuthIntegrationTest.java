package com.album.seplag.integration;

import com.album.seplag.dto.LoginRequest;
import com.album.seplag.dto.LoginResponse;
import com.album.seplag.dto.UsuarioRegisterDTO;
import com.album.seplag.exception.InvalidCredentialsException;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.UsuarioRepository;
import com.album.seplag.service.AuthService;
import com.album.seplag.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setUsername("testuser");
        usuario.setPassword(passwordEncoder.encode("password123"));
        usuario.setEmail("test@example.com");
        usuario.setAtivo(true);
        usuario.setRoles(new java.util.HashSet<>(Set.of("ROLE_USER")));
        usuarioRepository.save(usuario);
    }

    @Test
    void login_ShouldReturnToken_WhenCredentialsAreValid() {
        LoginRequest request = new LoginRequest("testuser", "password123");

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.token());
        assertEquals("Bearer", response.type());
        assertNotNull(response.expiresIn());
    }

    @Test
    void login_ShouldThrowException_WhenCredentialsAreInvalid() {
        LoginRequest request = new LoginRequest("testuser", "wrongpassword");

        assertThrows(InvalidCredentialsException.class, () -> {
            authService.login(request);
        });
    }

    @Test
    void loadUserByUsername_ShouldReturnUserDetails_WhenUserExists() {
        var userDetails = usuarioService.loadUserByUsername("testuser");

        assertNotNull(userDetails);
        assertEquals("testuser", userDetails.getUsername());
    }

    @Test
    void register_ShouldReturnToken_WhenDataIsValid() {
        var request = new UsuarioRegisterDTO("newuser", "password123", "newuser@example.com");

        LoginResponse response = authService.register(request);

        assertNotNull(response);
        assertNotNull(response.token());
        assertEquals("Bearer", response.type());
        assertNotNull(response.expiresIn());
        assertTrue(usuarioRepository.findByUsername("newuser").isPresent());
    }
}

