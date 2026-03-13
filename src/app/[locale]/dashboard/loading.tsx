import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-6">
            <div className="h-5 w-32 rounded bg-muted animate-pulse mb-2" />
            <div className="h-4 w-48 rounded bg-muted animate-pulse mb-4" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
