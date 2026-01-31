package com.album.seplag.service;

import com.album.seplag.dto.ArtistaDTO;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Artista;
import com.album.seplag.repository.ArtistaRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArtistaServiceTest {

    @Mock
    private ArtistaRepository artistaRepository;

    @InjectMocks
    private ArtistaService artistaService;

    private Artista artista;

    @BeforeEach
    void setUp() {
        artista = new Artista();
        artista.setId(1L);
        artista.setNome("Artista Teste");
        artista.setGenero("Rock");
        artista.setBiografia("Biografia do artista");
        artista.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void findById_ShouldReturnArtistaDTO_WhenArtistaExists() {
        when(artistaRepository.findById(1L)).thenReturn(Optional.of(artista));

        ArtistaDTO result = artistaService.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("Artista Teste", result.nome());
        verify(artistaRepository).findById(1L);
    }

    @Test
    void findById_ShouldThrowException_WhenArtistaNotFound() {
        when(artistaRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            artistaService.findById(1L);
        });
    }

    @Test
    void findAll_ShouldReturnPageOfArtistas() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Artista> artistaPage = new PageImpl<>(List.of(artista), pageable, 1);
        when(artistaRepository.findAll(pageable)).thenReturn(artistaPage);

        Page<ArtistaDTO> result = artistaService.findAll(null, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(artistaRepository).findAll(pageable);
    }

    @Test
    void delete_ShouldDeleteArtista_WhenArtistaExists() {
        when(artistaRepository.findById(1L)).thenReturn(Optional.of(artista));
        doNothing().when(artistaRepository).delete(artista);

        assertDoesNotThrow(() -> {
            artistaService.delete(1L);
        });

        verify(artistaRepository).findById(1L);
        verify(artistaRepository).delete(artista);
    }
}

