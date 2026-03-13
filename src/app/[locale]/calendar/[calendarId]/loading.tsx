import { Loader2 } from 'lucide-react';

export default function CalendarLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm bg-muted animate-pulse" />
          <div>
            <div className="h-6 w-48 rounded-sm bg-muted animate-pulse" />
            <div className="h-4 w-64 rounded-sm bg-muted animate-pulse mt-1" />
          </div>
        </div>
      </div>
      <div className="rounded-sm border bg-card p-4">
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
