"use client"

import { Play, Map, Trophy, BookOpen, Gamepad2 } from "lucide-react"
import { MODE_INFO, type GameMode, getBestScore } from "@/lib/game-config"
import { useEffect, useState } from "react"

export default function MainMenu({
  onPlay,
  onSelectMap,
  onLeaderboard,
  onInstructions,
  onPickMode,
  mode,
}: {
  onPlay: () => void
  onSelectMap: () => void
  onLeaderboard: () => void
  onInstructions: () => void
  onPickMode: (m: GameMode) => void
  mode: GameMode
}) {
  const [best, setBest] = useState(0)
  useEffect(() => setBest(getBestScore()), [])

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl">
          <Gamepad2 className="size-10" />
        </div>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground">
          Snake Adventure <span className="text-primary">2D</span>
        </h1>
        <p className="text-sm text-muted-foreground">Arcade · Casual · Single Player</p>
        {best > 0 && (
          <p className="mt-1 flex items-center gap-1 text-sm text-accent">
            <Trophy className="size-4" /> Kỷ lục: {best}
          </p>
        )}
      </div>

      {/* mode picker */}
      <div className="grid w-full grid-cols-3 gap-2">
        {(Object.keys(MODE_INFO) as GameMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onPickMode(m)}
            className={`rounded-xl border p-3 text-sm font-semibold transition ${
              mode === m
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-card-foreground hover:bg-secondary"
            }`}
          >
            {MODE_INFO[m].label}
          </button>
        ))}
      </div>
      <p className="-mt-5 text-xs text-muted-foreground">{MODE_INFO[mode].desc}</p>

      <div className="flex w-full flex-col gap-3">
        <MenuButton primary icon={<Play className="size-5" />} label="Chơi Ngay" onClick={onPlay} />
        <MenuButton icon={<Map className="size-5" />} label="Chọn Map" onClick={onSelectMap} />
        <MenuButton icon={<Trophy className="size-5" />} label="Bảng Xếp Hạng" onClick={onLeaderboard} />
        <MenuButton icon={<BookOpen className="size-5" />} label="Hướng Dẫn" onClick={onInstructions} />
      </div>
    </div>
  )
}

function MenuButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold shadow-sm transition active:scale-[0.98] ${
        primary
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border border-border bg-card text-card-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
