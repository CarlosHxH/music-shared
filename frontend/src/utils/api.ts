import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Aumentado para 10 segundos (mais tempo para o rate limit resetar)
const RATE_LIMIT_RETRY_DELAY_MS = 10000;
const MAX_RATE_LIMIT_RETRIES = 2; // Máximo de 2 tentativas de retry

/**
 * Instância do Axios configurada com interceptadores
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptador de requisição para adicionar token JWT
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Endpoints de auth que não devem acionar refresh/redirect em 401 */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

/**
 * Interceptador de resposta para lidar com token expirado
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url
      ? AUTH_ENDPOINTS.some((ep) => originalRequest.url.includes(ep))
      : false;

    // Em login/register, 401 = credenciais inválidas - rejeitar para o componente tratar
    if (isAuthEndpoint && error.response?.status === 401) {
      return Promise.reject(error);
    }

    // Se receber 401 e ainda não tentou refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Sem refresh token, redirecionar para login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Tentar renovar o token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Repetir a requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Falha ao renovar, fazer logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Rate limit 429: retry com backoff exponencial
    if (error.response?.status === 429 && originalRequest) {
      const retryCount = (originalRequest._retry429Count as number) || 0;
      
      if (retryCount < MAX_RATE_LIMIT_RETRIES) {
        originalRequest._retry429Count = retryCount + 1;
        
        // Usar header Retry-After se disponível, senão usar delay progressivo
        const retryAfter = error.response?.headers?.['retry-after'];
        const baseDelay = retryAfter
          ? Math.max(2000, parseInt(retryAfter, 10) * 1000)
          : RATE_LIMIT_RETRY_DELAY_MS;
        
        // Backoff exponencial: primeira tentativa usa delay base, segunda usa 2x
        const delayMs = baseDelay * (retryCount + 1);
        const delaySec = Math.ceil(delayMs / 1000);

        toast.warning(
          `Muitas requisições. Tentando novamente em ${delaySec} segundos... (${retryCount + 1}/${MAX_RATE_LIMIT_RETRIES})`,
          {
            id: 'rate-limit',
            duration: delayMs,
          }
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api(originalRequest);
      } else {
        // Excedeu número máximo de tentativas
        (error as { _rateLimitHandled?: boolean })._rateLimitHandled = true;
        const retryAfter = error.response?.headers?.['retry-after'];
        const segundos = retryAfter ? parseInt(retryAfter, 10) : 10;
        
        toast.error(
          `Rate limit excedido. Aguarde ${segundos} segundos antes de tentar novamente.`,
          {
            id: 'rate-limit',
            duration: segundos * 1000,
          }
        );
      }
    }

    // 429 após todas as tentativas: marcar para evitar duplicata no componente
    if (error.response?.status === 429) {
      (error as { _rateLimitHandled?: boolean })._rateLimitHandled = true;
    }
    return Promise.reject(error);
  }
);

export default api;
