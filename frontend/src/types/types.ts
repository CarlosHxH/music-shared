/**
 * Tipos e Interfaces da Aplicação
 */

export type TipoArtista = 'CANTOR' | 'BANDA';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  roles?: string[];
}

export interface Artista {
  id: number;
  nome: string;
  tipoArtista?: TipoArtista;
  descricao?: string;
  biografia?: string;
  fotoNomeArquivo?: string;
  fotoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  albumCount?: number;
  quantidadeAlbuns?: number;
}

export interface Album {
  id: number;
  titulo: string;
  artistaId: number;
  artistaNome: string;
  dataLancamento?: string;
  createdAt: string;
  capas: CapaAlbum[];
}

export interface CapaAlbum {
  id: number;
  nomeArquivo: string;
  contentType: string;
  tamanho: number;
  dataUpload: string;
  url?: string;
  presignedUrl?: string;
}

export interface Regional {
  id: number;
  nome: string;
  ativo: boolean;
  dataSincronizacao?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Resposta paginada do backend (PageResponseDTO) */
export interface BackendPageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario?: Usuario;
}

export interface ApiError {
  message?: string;
  status?: number;
}
