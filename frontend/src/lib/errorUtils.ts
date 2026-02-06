/**
 * Extrai mensagem de erro de respostas da API (Axios) ou erros genéricos.
 * Compatível com ErrorResponse do backend: { timestamp, status, error, message, path }
 * e outros formatos: { message }, { error }, { detail }, { errors: string[] }
 */
export function getErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado'): string {
  if (!error) return fallback;

  // Erro Axios com response (ErrorResponse do backend usa campo 'message')
  const err = error as { response?: { data?: unknown; status?: number } };
  const data = err.response?.data;

  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
    if (typeof obj.detail === 'string' && obj.detail.trim()) return obj.detail;
    if (Array.isArray(obj.errors) && obj.errors.length > 0 && typeof obj.errors[0] === 'string')
      return obj.errors[0];
  }

  // Erro de rede (sem response)
  if (!err.response && error instanceof Error) {
    const msg = error.message;
    if (msg === 'Network Error' || msg.includes('fetch')) return 'Erro de conexão. Verifique sua internet.';
    return msg;
  }

  // ApiError (interface do projeto)
  const apiError = error as { message?: string };
  if (typeof apiError?.message === 'string' && apiError.message.trim()) return apiError.message;

  // Error nativo
  if (error instanceof Error) return error.message;

  return fallback;
}
