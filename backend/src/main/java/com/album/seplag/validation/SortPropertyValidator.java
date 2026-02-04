package com.album.seplag.validation;

/**
 * Utilitário para validação de propriedades de ordenação por entidade.
 */
public final class SortPropertyValidator {

    private SortPropertyValidator() {
    }

    public static String getEntityTypeFromPath(String path) {
        if (path != null && path.contains("/artistas")) {
            return "Artista";
        }
        if (path != null && path.contains("/albuns")) {
            return "Album";
        }
        return "a entidade";
    }

    public static String getValidPropertiesForEntity(String entityType) {
        return switch (entityType) {
            case "Artista" -> "id, nome, genero, createdAt, updatedAt";
            case "Album" -> "id, titulo, dataLancamento, createdAt, updatedAt";
            default -> "consulte a documentação da API";
        };
    }
}
