import { Trophy, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardProps {
  scores: any[];
  isLoading: boolean;
  currentUserId?: string;
  showLevel?: boolean;
  label?: string;
}

// ✅ Consistent name formatter — strips email domain if it looks like an email
const formatName = (username: string) => {
  if (!username) return 'Player';
  if (username.includes('@')) return username.split('@')[0];
  return username;
};

const RANK_CONFIG = [
  { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { color: 'text-slate-400',  bg: 'bg-slate-400/10',  border: 'border-slate-400/30'  },
  { color: 'text-amber-600',  bg: 'bg-amber-600/10',  border: 'border-amber-600/30'  },
];

export function Leaderboard({ scores, isLoading, currentUserId, showLevel, label }: LeaderboardProps) {
  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="h-7 w-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{label ?? 'Leaderboard'}</h2>
        {scores.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Top {scores.length}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-muted/50 animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>

      ) : scores.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Trophy className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-foreground">No scores yet</p>
          <p className="text-xs text-muted-foreground">Play a game to appear here!</p>
        </div>

      ) : (
        <div className="space-y-1.5 overflow-y-auto flex-1 no-scrollbar">
          {scores.map((s, i) => {
            const isCurrentUser = s.user_id === currentUserId;
            const isTop3 = i < 3;
            const rankCfg = isTop3 ? RANK_CONFIG[i] : null;
            const name = formatName(s.username);

            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150",
                  isCurrentUser
                    ? "bg-primary/8 border-primary/25"
                    : isTop3
                    ? cn("border", rankCfg!.bg, rankCfg!.border)
                    : "bg-muted/10 border-border/30 hover:bg-muted/20"
                )}
              >
                {/* Rank */}
                <div className="w-7 flex-shrink-0 flex items-center justify-center">
                  {i === 0 ? (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  ) : i === 1 ? (
                    <Medal className="h-4 w-4 text-slate-400" />
                  ) : i === 2 ? (
                    <Medal className="h-4 w-4 text-amber-600" />
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-semibold w-full text-center">
                      #{i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border",
                  isCurrentUser
                    ? "bg-primary text-primary-foreground border-primary/30"
                    : isTop3
                    ? cn(rankCfg!.bg, rankCfg!.color, rankCfg!.border)
                    : "bg-muted text-muted-foreground border-border/40"
                )}>
                  {name.charAt(0).toUpperCase()}
                </div>

                {/* Name + time */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn(
                      "text-xs font-semibold truncate",
                      isCurrentUser ? "text-primary" : "text-foreground"
                    )}>
                      {name}
                    </p>
                    {isCurrentUser && (
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                        you
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Score + level */}
                <div className="text-right flex-shrink-0">
                  <p className={cn(
                    "text-sm font-bold",
                    isTop3 ? rankCfg!.color : "text-foreground"
                  )}>
                    {s.score.toLocaleString()}
                  </p>
                  {showLevel && s.level && (
                    <p className="text-[10px] text-muted-foreground">Lv {s.level}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}