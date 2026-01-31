package com.album.seplag.service;

import com.album.seplag.dto.AlbumDTO;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Album;
import com.album.seplag.model.Artista;
import com.album.seplag.model.Usuario;
import com.album.seplag.repository.AlbumRepository;
import com.album.seplag.repository.ArtistaRepository;
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
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlbumServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private ArtistaRepository artistaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MinIOService minIOService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AlbumService albumService;

    private Album album;
    private Artista artista;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        artista = new Artista();
        artista.setId(1L);
        artista.setNome("Artista Teste");

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("testuser");

        album = new Album();
        album.setId(1L);
        album.setTitulo("Álbum Teste");
        album.setDataLancamento(LocalDate.now());
        album.setArtista(artista);
        album.setUsuario(usuario);
        album.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void findById_ShouldReturnAlbumDTO_WhenAlbumExists() {
        when(albumRepository.findById(1L)).thenReturn(Optional.of(album));

        AlbumDTO result = albumService.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Álbum Teste", result.titulo());
        verify(albumRepository).findById(1L);
    }

    @Test
    void findById_ShouldThrowException_WhenAlbumNotFound() {
        when(albumRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            albumService.findById(1L);
        });
    }

    @Test
    void findAll_ShouldReturnPageOfAlbums() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Album> albumPage = new PageImpl<>(List.of(album), pageable, 1);
        when(albumRepository.findAll(pageable)).thenReturn(albumPage);

        Page<AlbumDTO> result = albumService.findAll(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(albumRepository).findAll(pageable);
    }

    @Test
    void delete_ShouldDeleteAlbum_WhenAlbumExists() {
        when(albumRepository.findById(1L)).thenReturn(Optional.of(album));
        doNothing().when(albumRepository).delete(album);

        assertDoesNotThrow(() -> {
            albumService.delete(1L);
        });

        verify(albumRepository).findById(1L);
        verify(albumRepository).delete(album);
    }

    @Test
    void delete_ShouldThrowException_WhenAlbumNotFound() {
        when(albumRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            albumService.delete(1L);
        });
    }
}

