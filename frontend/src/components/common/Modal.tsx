import { type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

/**
 * Modal genérico com overlay e botão de fechar
 * @param open - Controla visibilidade
 * @param onClose - Callback ao fechar
 * @param children - Conteúdo do modal
 * @param title - Título opcional
 */
export default function Modal({ open, onClose, children, title }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 rounded-lg max-w-3xl w-full mx-4 p-4 border border-slate-700 shadow-lg">
        {title && <div className="text-lg font-semibold text-white mb-2">{title}</div>}
        <div>{children}</div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-300 hover:text-white"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
