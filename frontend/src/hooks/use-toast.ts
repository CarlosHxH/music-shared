import { useCallback, useState } from 'react';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Hook simples para notificações toast.
 * Em ambiente de desenvolvimento, exibe no console.
 * Para UI completa, integre com @radix-ui/react-toast.
 */
export function useToast() {
  const [, setKey] = useState(0);

  const toast = useCallback((options: ToastOptions) => {
    const msg = options.description || options.title || 'Notificação';
    if (options.variant === 'destructive') {
      console.error('[Toast]', options.title, msg);
    } else {
      console.log('[Toast]', options.title, msg);
    }
    setKey((k) => k + 1);
  }, []);

  return { toast };
}
