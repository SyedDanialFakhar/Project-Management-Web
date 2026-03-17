import { Plus } from 'lucide-react';

interface NewProjectCardProps {
  onClick: () => void;
}

export function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-dashed bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all duration-200 cursor-pointer min-h-[160px]"
    >
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">
        New Project
      </span>
    </div>
  );
}