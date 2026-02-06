import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton do card de artista para estado de carregamento */
export default function ArtistCardSkeleton() {
  return (
    <Card className="bg-slate-800/60 border-slate-700 overflow-hidden p-0 gap-0">
      <Skeleton className="h-48 w-full rounded-none bg-slate-700" />
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 bg-slate-700" />
        <Skeleton className="h-4 w-1/2 mt-2 bg-slate-700" />
      </CardContent>
    </Card>
  );
}
