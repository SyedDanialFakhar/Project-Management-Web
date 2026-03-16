import { usePacmanLeaderboard } from "@/hooks/usePacmanLeaderboard.tsx";

export default function PacmanLeaderboard() {
  const { data: scores = [] } = usePacmanLeaderboard();

  return (
    <div className="w-full max-w-md bg-card border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
      <div className="space-y-2">
        {scores.map((s, i) => (
          <div key={s.id} className="flex justify-between text-sm">
            <span>#{i + 1}</span>
            <span>{s.score}</span>
            <span>Lv {s.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}