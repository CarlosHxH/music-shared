package com.album.seplag.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Direção de ordenação para paginação.
 */
@Schema(description = "Direção de ordenação", allowableValues = {"ASC", "DESC"})
public enum SortDirection {
    ASC,
    DESC
}
