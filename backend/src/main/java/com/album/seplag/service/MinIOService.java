package com.album.seplag.service;

import com.album.seplag.config.MinIOConfig;
import com.album.seplag.dto.PresignedUrlResponse;
import com.album.seplag.exception.ResourceNotFoundException;
import com.album.seplag.model.Album;
import com.album.seplag.model.CapaAlbum;
import com.album.seplag.repository.AlbumRepository;
import com.album.seplag.repository.CapaAlbumRepository;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Service
public class MinIOService {

    private final MinioClient minioClient;
    private final String bucketName;
    private final Long presignedUrlExpiration;
    private final AlbumRepository albumRepository;
    private final CapaAlbumRepository capaAlbumRepository;

    public MinIOService(MinIOConfig minIOConfig,
                       @Value("${minio.bucket-name}") String bucketName,
                       @Value("${minio.presigned-url-expiration}") Long presignedUrlExpiration,
                       AlbumRepository albumRepository,
                       CapaAlbumRepository capaAlbumRepository) {
        this.minioClient = minIOConfig.minioClient();
        this.bucketName = bucketName;
        this.presignedUrlExpiration = presignedUrlExpiration;
        this.albumRepository = albumRepository;
        this.capaAlbumRepository = capaAlbumRepository;
        initializeBucket();
    }

    private void initializeBucket() {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (Exception e) {
            throw new RuntimeException("Erro ao inicializar bucket MinIO", e);
        }
    }

    @Transactional
    public CapaAlbum uploadCapa(Long albumId, MultipartFile file) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Álbum não encontrado com id: " + albumId));

        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            String objectName = "albuns/" + albumId + "/" + fileName;

            InputStream inputStream = file.getInputStream();
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            CapaAlbum capa = new CapaAlbum();
            capa.setAlbum(album);
            capa.setNomeArquivo(objectName);
            capa.setContentType(file.getContentType());
            capa.setTamanho(file.getSize());

            return capaAlbumRepository.save(capa);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao fazer upload da capa", e);
        }
    }

    public PresignedUrlResponse getPresignedUrl(Long albumId, Long capaId) {
        CapaAlbum capa = capaAlbumRepository.findById(capaId)
                .orElseThrow(() -> new ResourceNotFoundException("Capa não encontrada com id: " + capaId));

        if (!capa.getAlbum().getId().equals(albumId)) {
            throw new ResourceNotFoundException("Capa não pertence ao álbum especificado");
        }

        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(capa.getNomeArquivo())
                            .expiry((int) (presignedUrlExpiration / 1000))
                            .build()
            );

            return new PresignedUrlResponse(url, presignedUrlExpiration);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar URL pré-assinada", e);
        }
    }
}

