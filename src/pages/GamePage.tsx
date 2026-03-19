import { useEffect, useRef, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabaseClient';
import { usePacmanLeaderboard } from "@/hooks/usePacmanLeaderboard";
import { useFlappyLeaderboard } from "@/hooks/useFlappyLeaderboard";
import { GameCard } from "@/components/GameCard";
import { Leaderboard } from "@/components/LeaderBoard";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type GameType = 'pacman' | 'flappy';

const GAMES = [
  {
    id: 'pacman' as GameType,
    title: 'Pac-Man',
    description: 'Eat all dots, dodge ghosts, and chase the high score!',
    emoji: '🟡',
    color: 'bg-yellow-500/10',
    src: '/pacman/index.html',
    frameWidth: '100%',
    frameHeight: '100%',
  },
  {
    id: 'flappy' as GameType,
    title: 'Flappy Bird',
    description: 'Tap to fly, dodge the pipes, and beat your best!',
    emoji: '🐦',
    color: 'bg-blue-500/10',
    src: '/flappy/index.html',
    frameWidth: '100%',
    frameHeight: '100%',
  },
];

export default function GamePage() {
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);
  const queryClient = useQueryClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [lastScores, setLastScores] = useState<Record<GameType, number>>({ pacman: 0, flappy: 0 });

  const { data: pacmanScores = [], isLoading: pacmanLoading } = usePacmanLeaderboard();
  const { data: flappyScores = [], isLoading: flappyLoading } = useFlappyLeaderboard();

  const activeGame = GAMES.find(g => g.id === selectedGame);

  const toggleFullscreen = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (!document.fullscreenElement) {
      iframe.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!userRow?.id) return;

      // Pacman
      if (event.data?.type === 'PACMAN_GAME_OVER') {
        const { score, level } = event.data;
        setLastScores(prev => ({ ...prev, pacman: Math.max(prev.pacman, score) }));
        await supabase.from('pacman_scores').insert({
          user_id: userRow.id,
          username: userRow.name || user?.email?.split('@')[0] || 'Player',
          score,
          level,
        });
        queryClient.invalidateQueries({ queryKey: ['pacman_scores'] });
      }

      // Flappy
      if (event.data?.type === 'FLAPPY_GAME_OVER') {
        const { score } = event.data;
        setLastScores(prev => ({ ...prev, flappy: Math.max(prev.flappy, score) }));
        await supabase.from('flappy_scores').insert({
          user_id: userRow.id,
          username: userRow.name || user?.email?.split('@')[0] || 'Player',
          score,
        });
        queryClient.invalidateQueries({ queryKey: ['flappy_scores'] });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, userRow, queryClient]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">Game Arcade</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pick a game and beat the leaderboard</p>
        </div>
        {selectedGame && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedGame(null)} className="gap-1.5">
              ← Back
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-1.5">
              <Maximize2 className="h-3.5 w-3.5" />
              Fullscreen
            </Button>
          </div>
        )}
      </div>

      {/* ── Game selection ── */}
      {!selectedGame && (
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto space-y-10">

            {/* Game picker */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">Choose a Game</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GAMES.map(g => (
                  <GameCard
                    accentColor={g.color}
                    key={g.id}
                    title={g.title}
                    description={g.description}
                    emoji={g.emoji}
                    color={g.color}
                    highScore={lastScores[g.id] || undefined}
                    isSelected={false}
                    onClick={() => setSelectedGame(g.id)}
                  />
                ))}
              </div>
            </div>

            {/* Leaderboards side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border/60 rounded-2xl p-5 bg-card h-96">
                <Leaderboard
                  scores={pacmanScores}
                  isLoading={pacmanLoading}
                  currentUserId={userRow?.id}
                  showLevel
                  label="🟡 Pac-Man Leaderboard"
                />
              </div>
              <div className="border border-border/60 rounded-2xl p-5 bg-card h-96">
                <Leaderboard
                  scores={flappyScores}
                  isLoading={flappyLoading}
                  currentUserId={userRow?.id}
                  label="🐦 Flappy Bird Leaderboard"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Active game ── */}
      {selectedGame && activeGame && (
        <div className="flex flex-1 overflow-hidden">
          {/* Game iframe */}
          <div className="flex-1 bg-black relative">
            <iframe
              ref={iframeRef}
              src={activeGame.src}
              className="w-full h-full border-none"
              title={activeGame.title}
            />
          </div>

          {/* Sidebar leaderboard */}
          <div className="w-72 border-l bg-background p-4 flex flex-col overflow-hidden flex-shrink-0">
            <Leaderboard
              scores={selectedGame === 'pacman' ? pacmanScores : flappyScores}
              isLoading={selectedGame === 'pacman' ? pacmanLoading : flappyLoading}
              currentUserId={userRow?.id}
              showLevel={selectedGame === 'pacman'}
              label={selectedGame === 'pacman' ? '🟡 Pac-Man Top 10' : '🐦 Flappy Top 10'}
            />
          </div>
        </div>
      )}

    </div>
  );
}