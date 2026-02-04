package com.album.seplag.service;

import com.album.seplag.model.Usuario;
import com.album.seplag.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("testuser");
        usuario.setPassword("$2a$10$encodedPassword");
        usuario.setEmail("test@example.com");
        usuario.setAtivo(true);
        usuario.setRoles(Set.of("ROLE_USER"));
    }

    @Test
    void loadUserByUsername_ShouldReturnUserDetails_WhenUserExists() {
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(usuario));

        UserDetails result = usuarioService.loadUserByUsername("testuser");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(usuarioRepository).findByUsername("testuser");
    }

    @Test
    void loadUserByUsername_ShouldThrowException_WhenUserNotFound() {
        when(usuarioRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> {
            usuarioService.loadUserByUsername("nonexistent");
        });

        verify(usuarioRepository).findByUsername("nonexistent");
    }

    @Test
    void loadUserByUsername_ShouldThrowException_WhenUserInactive() {
        usuario.setAtivo(false);
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(usuario));

        assertThrows(UsernameNotFoundException.class, () -> {
            usuarioService.loadUserByUsername("testuser");
        });
    }
}

