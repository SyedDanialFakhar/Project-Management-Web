import { useEffect, useRef } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabaseClient';
import PacmanLeaderboard from "@/components/PacmanLeaderboard";

export default function GamePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fullscreen button handler
  const toggleFullscreen = () => {
    const iframe = iframeRef.current;
    if (iframe) {
      if (!document.fullscreenElement) {
        iframe.requestFullscreen().catch(console.error);
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Listen for game over (same as before)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "PACMAN_GAME_OVER") {
        const { score: gameScore, level: gameLevel } = event.data;
        if (!user?.id) return;

        const { error } = await supabase.from("pacman_scores").insert({
          user_id: user.id,
          username: user.user_metadata?.full_name || user.email?.split("@")[0] || "Player",
          score: gameScore,
          level: gameLevel
        });

        if (!error) queryClient.invalidateQueries({ queryKey: ["pacman_scores"] });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user, queryClient]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <h1 className="text-lg font-semibold">Pac-Man</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Beat the high score 👻</p>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md text-sm flex items-center gap-2"
          >
            ⛶ Fullscreen
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 bg-black relative">
          <iframe
            ref={iframeRef}
            src="/pacman/index.html"
            className="w-full h-full border-none"
            title="Pac-Man"
          />
        </div>
        <div className="w-80 border-l p-4">
          <PacmanLeaderboard />
        </div>
      </div>
    </div>
  );
}