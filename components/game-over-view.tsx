"use client"

import { RotateCcw, Map, Home, Trophy, PartyPopper } from "lucide-react"
import type { GameResult } from "@/components/snake-game"
import { MAPS, getBestScore } from "@/lib/game-config"
import { useEffect, useState } from "react"

export default function GameOverView({
  result,
  onRetry,
  onSelectMap,
  onMenu,
}: {
  result: GameResult
  onRetry: () => void
  onSelectMap: () => void
  onMenu: () => void
}) {
  const [best, setBest] = useState(0)
  useEffect(() => setBest(getBestScore()), [])
  const isRecord = result.score >= best && result.score > 0
  const map = MAPS.find((m) => m.id === result.mapId)

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        {result.won ? (
          <>
            <PartyPopper className="size-12 text-accent" />
            <h2 className="text-3xl font-extrabold text-foreground">Chiến Thắng!</h2>
            <p className="text-sm text-muted-foreground">Bạn đã hoàn thành {map?.name}</p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-destructive">Game Over</h2>
            <p className="text-sm text-muted-foreground">{map?.name}</p>
          </>
        )}
      </div>

      {isRecord && (
        <div className="flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
          <Trophy className="size-4" /> Kỷ lục cá nhân mới!
        </div>
      )}

      <div className="grid w-full grid-cols-3 gap-3">
        <Stat label="Điểm" value={String(result.score)} highlight />
        <Stat label="Thời gian" value={fmt(result.durationMs)} />
        <Stat label="Thức ăn" value={String(result.foodEaten)} />
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
        >
          <RotateCcw className="size-5" /> Chơi Lại
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onSelectMap}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-semibold text-card-foreground transition hover:bg-secondary"
          >
            <Map className="size-5" /> Chọn Map
          </button>
          <button
            onClick={onMenu}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-semibold text-card-foreground transition hover:bg-secondary"
          >
            <Home className="size-5" /> Menu
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono text-xl font-bold ${highlight ? "text-primary" : "text-card-foreground"}`}>
        {value}
      </div>
    </div>
  )
}
