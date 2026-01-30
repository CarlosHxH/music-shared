-- =====================================================
-- Migration: V2 - Criação da tabela de roles de usuário
-- Descrição: Tabela de relacionamento muitos-para-muitos entre usuários e roles
-- =====================================================

-- Tabela de roles de usuário
-- Permite que um usuário tenha múltiplas roles (ex: ADMIN e USER simultaneamente)
CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (usuario_id, role),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT ck_role_nome CHECK (role IN ('ROLE_USER', 'ROLE_ADMIN'))
);

-- Comentários de documentação
COMMENT ON TABLE usuario_roles IS 'Permissões granulares (N:N) para Spring Security.';
COMMENT ON COLUMN usuario_roles.usuario_id IS 'Referência ao ID do usuário.';
COMMENT ON COLUMN usuario_roles.role IS 'Nome da role (ROLE_USER ou ROLE_ADMIN).';
