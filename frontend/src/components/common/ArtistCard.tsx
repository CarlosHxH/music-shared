import type { Artista } from '@/types/types';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  artist: Artista;
  onClick?: (id: number) => void;
}

/**
 * Card de exibição de artista na listagem
 * @param artist - Dados do artista
 * @param onClick - Callback ao clicar (recebe id do artista)
 */
export default function ArtistCard({ artist, onClick }: Props) {
  return (
    <Card
      className="bg-slate-800/60 border-slate-700 overflow-hidden p-0 gap-0 shadow-md hover:shadow-lg transition cursor-pointer min-w-0"
      onClick={() => onClick && onClick(artist.id)}
    >
      <div className="aspect-square w-full bg-gray-800 flex items-center justify-center">
        <img
          src={artist.fotoUrl ?? "/240x240.png"}
          alt={artist.nome}
          className="object-cover w-full h-full aspect-square"
        />
      </div>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-white font-semibold truncate">{artist.nome}</h3>
          <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-600 text-slate-300">
            {artist.tipoArtista === 'BANDA' ? 'Banda' : 'Cantor'}
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {artist.quantidadeAlbuns ?? artist.albumCount ?? 0} álbuns
        </p>
      </CardContent>
    </Card>
  );
}
