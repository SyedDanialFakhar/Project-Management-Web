import { cn } from '@/lib/utils';
import { Play, Trophy } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  emoji: string;
  color: string;
  accentColor: string;
  highScore?: number;
  isSelected: boolean;
  onClick: () => void;
}

export function GameCard({ title, description, emoji, color, accentColor, highScore, isSelected, onClick }: GameCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl border overflow-hidden transition-all duration-200 select-none group",
        "hover:-translate-y-1 hover:shadow-xl",
        isSelected
          ? "border-primary/50 shadow-lg -translate-y-1"
          : "border-border/60 bg-card hover:border-primary/30"
      )}
    >
      {/* Top gradient band */}
      <div className={cn("h-24 w-full flex items-center justify-center relative", color)}>
        <span className="text-5xl drop-shadow-lg">{emoji}</span>

        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/5" />

        {highScore ? (
          <div className="absolute top-2.5 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
            <Trophy className="h-2.5 w-2.5 text-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-400">{highScore.toLocaleString()}</span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{description}</p>

        {/* Play button */}
        <button className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
          isSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : cn("text-foreground border border-border/60 hover:border-primary/40 group-hover:bg-primary/5", accentColor)
        )}>
          <Play className="h-3 w-3" fill="currentColor" />
          {isSelected ? 'Currently Playing' : `Play ${title}`}
        </button>
      </div>
    </div>
  );
}