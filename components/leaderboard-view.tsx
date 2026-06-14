"use client"

import { ArrowLeft, Medal, Trophy } from "lucide-react"
import { loadLeaderboard, MAPS, MODE_INFO, type ScoreEntry } from "@/lib/game-config"
import { useEffect, useState } from "react"

export default function LeaderboardView({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<ScoreEntry[]>([])
  useEffect(() => setEntries(loadLeaderboard()), [])

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-border bg-card p-2 text-card-foreground transition hover:bg-secondary"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Trophy className="size-6 text-accent" /> Bảng Xếp Hạng
        </h2>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          Chưa có điểm nào. Hãy chơi để ghi danh!
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((e, i) => {
            const map = MAPS.find((m) => m.id === e.mapId)
            const medal = i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : ""
            return (
              <li
                key={`${e.date}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className={`flex size-8 items-center justify-center font-bold ${medal}`}>
                  {i < 3 ? <Medal className="size-5" /> : <span className="text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-card-foreground">{map?.name ?? "Map"}</div>
                  <div className="text-xs text-muted-foreground">
                    {MODE_INFO[e.mode].label} · {new Date(e.date).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="font-mono text-xl font-bold text-primary">{e.score}</div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
