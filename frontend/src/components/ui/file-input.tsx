import * as React from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const fileInputBaseStyles = [
  'relative w-full min-h-[100px] rounded-lg border-2 border-dashed transition-all duration-200',
  'bg-slate-800/50 border-slate-600 text-slate-300',
  'hover:border-emerald-500/60 hover:bg-slate-800/80',
  'focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500',
  'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  'file:absolute file:inset-0 file:opacity-0 file:cursor-pointer file:w-full file:h-full',
  'file:rounded-lg',
];

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /** Label do campo */
  label?: React.ReactNode;
  /** ID para associação com o label */
  id?: string;
  /** Placeholder exibido na área de drop */
  placeholder?: string;
  /** Callback com arquivo(s) selecionado(s) */
  onChange?: (files: File | File[] | null) => void;
  /** Aceitar múltiplos arquivos */
  multiple?: boolean;
  /** Classes adicionais para o container */
  className?: string;
}

/**
 * Input de arquivo com área de drag & drop, estilização consistente e acessibilidade.
 * Design System: Dark Mode / Spotify-like.
 */
function FileInput({
  id,
  label,
  placeholder,
  accept,
  multiple,
  onChange,
  disabled,
  className,
  ...props
}: FileInputProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      onChange?.(null);
      return;
    }
    if (multiple) {
      onChange?.(Array.from(files));
    } else {
      onChange?.(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const filterByAccept = (files: File[]): File[] => {
    if (!accept) return files;
    const patterns = accept.split(',').map((p) => p.trim().toLowerCase());
    return files.filter((f) => {
      const type = f.type.toLowerCase();
      const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
      return patterns.some((p) => {
        if (p.startsWith('.')) return ext === p;
        if (p.endsWith('/*')) return type.startsWith(p.replace('/*', '/'));
        return type === p || ext === p;
      });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const raw = Array.from(e.dataTransfer.files);
    const files = filterByAccept(raw);
    if (!files.length) return;
    if (multiple) {
      onChange?.(files);
    } else {
      onChange?.(files[0]);
    }
    if (inputRef.current) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
  };

  const defaultPlaceholder = multiple
    ? 'Arraste imagens aqui ou clique para selecionar'
    : 'Arraste uma imagem aqui ou clique para selecionar';

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id} className="text-slate-300">
          {label}
        </Label>
      )}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          ...fileInputBaseStyles,
          isDragging && 'border-emerald-500 bg-emerald-500/10',
          'group flex flex-col items-center justify-center gap-2 py-6 px-4 cursor-pointer'
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-label={typeof label === 'string' ? label : placeholder ?? defaultPlaceholder}
          {...props}
        />
        <Upload className="size-8 text-slate-500 group-hover:text-emerald-500/80" />
        <span className="text-sm text-slate-400 text-center max-w-[240px]">
          {placeholder ?? defaultPlaceholder}
        </span>
      </div>
    </div>
  );
}

export { FileInput };
