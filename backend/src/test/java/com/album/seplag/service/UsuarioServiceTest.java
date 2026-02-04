package com.album.seplag.service;

import com.album.seplag.dto.*;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.exception.UsuarioJaExisteException;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

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
        usuario.setCreatedAt(LocalDateTime.now());
        usuario.setLastLogin(null);
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

    @Test
    void create_ShouldReturnUsuarioDTO_WhenDataIsValid() {
        UsuarioCreateDTO dto = new UsuarioCreateDTO("newuser", "password123", "new@example.com", Set.of("ROLE_USER"));
        when(usuarioRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(2L);
            u.setCreatedAt(LocalDateTime.now());
            return u;
        });

        UsuarioDTO result = usuarioService.create(dto);

        assertNotNull(result);
        assertEquals("newuser", result.username());
        assertEquals("new@example.com", result.email());
        assertTrue(result.ativo());
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void create_ShouldThrowUsuarioJaExisteException_WhenUsernameExists() {
        UsuarioCreateDTO dto = new UsuarioCreateDTO("testuser", "password123", "other@example.com", null);
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(usuario));

        assertThrows(UsuarioJaExisteException.class, () -> usuarioService.create(dto));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void register_ShouldReturnUsuarioDTO_WithRoleUser() {
        UsuarioRegisterDTO dto = new UsuarioRegisterDTO("newuser", "password123", "new@example.com");
        when(usuarioRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(2L);
            u.setCreatedAt(LocalDateTime.now());
            return u;
        });

        UsuarioDTO result = usuarioService.register(dto);

        assertNotNull(result);
        assertEquals("newuser", result.username());
        assertEquals(Set.of("ROLE_USER"), result.roles());
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void update_ShouldReturnUsuarioDTO_WhenUserExists() {
        UsuarioUpdateDTO dto = new UsuarioUpdateDTO("updateduser", "updated@example.com");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.findByUsername("updateduser")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail("updated@example.com")).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioDTO result = usuarioService.update(1L, dto);

        assertNotNull(result);
        assertEquals("updateduser", result.username());
        assertEquals("updated@example.com", result.email());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void update_ShouldThrowResourceNotFoundException_WhenUserNotFound() {
        UsuarioUpdateDTO dto = new UsuarioUpdateDTO("updateduser", "updated@example.com");
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> usuarioService.update(999L, dto));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void delete_ShouldDeleteUser_WhenUserExists() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        doNothing().when(usuarioRepository).delete(usuario);

        assertDoesNotThrow(() -> usuarioService.delete(1L));
        verify(usuarioRepository).delete(usuario);
    }

    @Test
    void delete_ShouldThrowResourceNotFoundException_WhenUserNotFound() {
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> usuarioService.delete(999L));
        verify(usuarioRepository, never()).delete(any());
    }

    @Test
    void findAll_ShouldReturnPageOfUsuarioDTO() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Usuario> page = new PageImpl<>(List.of(usuario), pageable, 1);
        when(usuarioRepository.findAll(pageable)).thenReturn(page);

        Page<UsuarioDTO> result = usuarioService.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("testuser", result.getContent().get(0).username());
        verify(usuarioRepository).findAll(pageable);
    }

    @Test
    void findById_ShouldReturnUsuarioDTO_WhenUserExists() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        UsuarioDTO result = usuarioService.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("testuser", result.username());
        verify(usuarioRepository).findById(1L);
    }

    @Test
    void findById_ShouldThrowResourceNotFoundException_WhenUserNotFound() {
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> usuarioService.findById(999L));
    }

    @Test
    void alterarSenha_ShouldUpdatePassword_WhenCurrentPasswordIsCorrect() {
        AlterarSenhaDTO dto = new AlterarSenhaDTO("oldpass", "newpass123");
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("oldpass", usuario.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("newpass123")).thenReturn("encodedNew");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        assertDoesNotThrow(() -> usuarioService.alterarSenha("testuser", dto));
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void alterarSenha_ShouldThrowInvalidCredentialsException_WhenCurrentPasswordIsWrong() {
        AlterarSenhaDTO dto = new AlterarSenhaDTO("wrongpass", "newpass123");
        when(usuarioRepository.findByUsername("testuser")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("wrongpass", usuario.getPassword())).thenReturn(false);

        assertThrows(com.album.seplag.exception.InvalidCredentialsException.class, () ->
                usuarioService.alterarSenha("testuser", dto));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void alterarSenhaAdmin_ShouldUpdatePassword() {
        AlterarSenhaAdminDTO dto = new AlterarSenhaAdminDTO("newadminpass");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("newadminpass")).thenReturn("encodedNew");
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        assertDoesNotThrow(() -> usuarioService.alterarSenhaAdmin(1L, dto));
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void toggleAtivo_ShouldInvertAtivoStatus() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioDTO result = usuarioService.toggleAtivo(1L);

        assertNotNull(result);
        assertFalse(result.ativo());
        verify(usuarioRepository).save(usuario);
    }
}

