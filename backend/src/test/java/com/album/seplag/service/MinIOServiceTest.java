package com.album.seplag.service;

import com.album.seplag.config.MinIOConfig;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Album;
import com.album.seplag.model.Artista;
import com.album.seplag.model.CapaAlbum;
import com.album.seplag.repository.AlbumRepository;
import com.album.seplag.repository.CapaAlbumRepository;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MinIOServiceTest {

    @Mock
    private MinIOConfig minIOConfig;

    @Mock
    private MinioClient minioClient;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private CapaAlbumRepository capaAlbumRepository;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private MinIOService minIOService;

    private Album album;
    private Artista artista;
    private CapaAlbum capa;

    @BeforeEach
    void setUp() throws Exception {
        // Configurar mocks estáticos
        when(minIOConfig.minioClient()).thenReturn(minioClient);
        when(minioClient.bucketExists(any())).thenReturn(true);
        
        // Usar ReflectionTestUtils para injetar valores privados
        ReflectionTestUtils.setField(minIOService, "minioClient", minioClient);
        ReflectionTestUtils.setField(minIOService, "bucketName", "album-covers");
        ReflectionTestUtils.setField(minIOService, "presignedUrlExpiration", 1800000L);

        artista = new Artista();
        artista.setId(1L);
        artista.setNome("Artista Teste");

        album = new Album();
        album.setId(1L);
        album.setTitulo("Álbum Teste");
        album.setArtista(artista);

        capa = new CapaAlbum();
        capa.setId(1L);
        capa.setAlbum(album);
        capa.setNomeArquivo("albuns/1/test-file.jpg");
        capa.setContentType("image/jpeg");
        capa.setTamanho(1024L);
    }

    @Test
    void uploadCapa_ShouldThrowException_WhenAlbumNotFound() {
        when(albumRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            minIOService.uploadCapa(1L, multipartFile);
        });

        verify(albumRepository).findById(1L);
        verify(capaAlbumRepository, never()).save(any());
    }

    @Test
    void getPresignedUrl_ShouldThrowException_WhenCapaNotFound() {
        when(capaAlbumRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            minIOService.getPresignedUrl(1L, 1L);
        });

        verify(capaAlbumRepository).findById(1L);
    }

    @Test
    void getPresignedUrl_ShouldThrowException_WhenCapaDoesNotBelongToAlbum() {
        Album otherAlbum = new Album();
        otherAlbum.setId(2L);
        capa.setAlbum(otherAlbum);

        when(capaAlbumRepository.findById(1L)).thenReturn(Optional.of(capa));

        assertThrows(ResourceNotFoundException.class, () -> {
            minIOService.getPresignedUrl(1L, 1L);
        });
    }
}

