// components/seek/SkeletonCard.tsx
export function SkeletonCard() {
    return (
      <div className="flex flex-col h-full gap-4 p-6 rounded-3xl border border-border/40 bg-card animate-pulse">
        <div className="flex justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted/60 rounded w-4/5" />
            <div className="h-4 bg-muted/40 rounded w-1/2" />
          </div>
          <div className="h-6 w-14 bg-muted/40 rounded-2xl" />
        </div>
  
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="h-4 bg-muted/40 rounded" />
          <div className="h-4 bg-muted/40 rounded" />
          <div className="h-4 bg-muted/40 rounded" />
          <div className="h-4 bg-muted/40 rounded" />
        </div>
  
        <div className="h-px bg-border/30 my-1" />
  
        <div className="flex gap-3 mt-auto">
          <div className="flex-1 h-9 bg-muted/40 rounded-xl" />
          <div className="w-20 h-9 bg-muted/30 rounded-xl" />
        </div>
      </div>
    );
  }