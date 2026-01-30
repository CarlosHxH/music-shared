-- =====================================================
-- Migration: V5 - Criação da tabela de capas de álbum
-- Descrição: Tabela para armazenar informações das capas/imagens dos álbuns
-- =====================================================

-- Tabela de capas de álbum
-- Armazena metadados das imagens de capa dos álbuns (arquivos armazenados externamente)
CREATE TABLE IF NOT EXISTS capas_album (
    id BIGSERIAL PRIMARY KEY,                                    -- Identificador único da capa
    album_id BIGINT NOT NULL,                                    -- Referência ao álbum
    nome_arquivo VARCHAR(500) NOT NULL,                          -- Nome do arquivo da capa
    content_type VARCHAR(100),                                   -- Tipo MIME do arquivo (ex: image/jpeg)
    tamanho BIGINT,                                              -- Tamanho do arquivo em bytes
    data_upload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,    -- Data de upload da capa
    FOREIGN KEY (album_id) REFERENCES albuns(id) ON DELETE CASCADE  -- Remove capas ao deletar álbum
);

-- Índice para otimizar buscas por álbum
CREATE INDEX IF NOT EXISTS idx_capas_album_id ON capas_album(album_id);

-- Comentários nas colunas para documentação
COMMENT ON TABLE capas_album IS 'Tabela de capas/imagens dos álbuns';
COMMENT ON COLUMN capas_album.id IS 'Identificador único da capa';
COMMENT ON COLUMN capas_album.album_id IS 'Referência ao ID do álbum';
COMMENT ON COLUMN capas_album.nome_arquivo IS 'Nome do arquivo da capa';
COMMENT ON COLUMN capas_album.content_type IS 'Tipo MIME do arquivo (ex: image/jpeg, image/png)';
COMMENT ON COLUMN capas_album.tamanho IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN capas_album.data_upload IS 'Data e hora de upload da capa';

