import { X } from 'lucide-react';

export interface PreviewItem {
  id: string;
  url: string;
  onRemove?: () => void;
}

/**
 * Grid de mini previews de imagens com opção de remover
 */
export function ImagePreviewGrid({ items }: { items: PreviewItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-600 bg-slate-800 shrink-0"
        >
          <img
            src={item.url}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {item.onRemove && (
            <button
              type="button"
              onClick={item.onRemove}
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] touch-manipulation"
              aria-label="Remover"
            >
              <X className="size-5 text-red-400" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
