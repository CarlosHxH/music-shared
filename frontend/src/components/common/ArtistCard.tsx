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
      className="bg-slate-800/60 border-slate-700 overflow-hidden p-0 gap-0 shadow-md hover:shadow-lg transition cursor-pointer"
      onClick={() => onClick && onClick(artist.id)}
    >
      <div className="h-48 w-full bg-gray-800 flex items-center justify-center">
        <img
          src={artist.fotoUrl ?? "/240x240.png"}
          alt={artist.nome}
          className="object-cover h-48 w-full"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="text-white font-semibold truncate">{artist.nome}</h3>
        <p className="text-sm text-slate-400 mt-1">
          {artist.quantidadeAlbuns ?? artist.albumCount ?? 0} álbuns
        </p>
      </CardContent>
    </Card>
  );
}
