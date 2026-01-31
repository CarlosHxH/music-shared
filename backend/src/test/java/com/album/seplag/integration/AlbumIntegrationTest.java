package com.album.seplag.integration;

import com.album.seplag.dto.AlbumDTO;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Album;
import com.album.seplag.model.Artista;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.AlbumRepository;
import com.album.seplag.repository.ArtistaRepository;
import com.album.seplag.repository.UsuarioRepository;
import com.album.seplag.service.AlbumService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AlbumIntegrationTest {

    @Autowired
    private AlbumService albumService;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private ArtistaRepository artistaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Artista artista;
    private Album album;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setUsername("testuser");
        usuario.setPassword(passwordEncoder.encode("password123"));
        usuario.setEmail("test@example.com");
        usuario.setAtivo(true);
        usuario.setRoles(Set.of("ROLE_USER"));
        usuario = usuarioRepository.save(usuario);

        artista = new Artista();
        artista.setNome("Artista Teste");
        artista.setGenero("Rock");
        artista = artistaRepository.save(artista);

        album = new Album();
        album.setTitulo("Álbum Teste");
        album.setDataLancamento(LocalDate.now());
        album.setArtista(artista);
        album.setUsuario(usuario);
        album = albumRepository.save(album);
    }

    @Test
    void findById_ShouldReturnAlbum_WhenAlbumExists() {
        AlbumDTO result = albumService.findById(album.getId());

        assertNotNull(result);
        assertEquals(album.getId(), result.id());
        assertEquals("Álbum Teste", result.titulo());
    }

    @Test
    void findById_ShouldThrowException_WhenAlbumNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> {
            albumService.findById(999L);
        });
    }

    @Test
    void findAll_ShouldReturnPageOfAlbums() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<AlbumDTO> result = albumService.findAll(pageable);

        assertNotNull(result);
        assertTrue(result.getTotalElements() > 0);
    }

    @Test
    void delete_ShouldDeleteAlbum_WhenAlbumExists() {
        Long albumId = album.getId();
        
        assertDoesNotThrow(() -> {
            albumService.delete(albumId);
        });

        assertThrows(ResourceNotFoundException.class, () -> {
            albumService.findById(albumId);
        });
    }
}

