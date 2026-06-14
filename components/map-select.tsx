"use client"

import { ArrowLeft, Lock, Target } from "lucide-react"
import { MAPS, type Difficulty } from "@/lib/game-config"

const diffColor: Record<Difficulty, string> = {
  Dễ: "bg-lime-500/20 text-lime-300",
  "Trung Bình": "bg-amber-500/20 text-amber-300",
  Khó: "bg-orange-500/20 text-orange-300",
  "Rất Khó": "bg-red-500/20 text-red-300",
}

export default function MapSelect({
  onBack,
  onPick,
  unlockedUpTo,
}: {
  onBack: () => void
  onPick: (mapId: number) => void
  unlockedUpTo: number
}) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-border bg-card p-2 text-card-foreground transition hover:bg-secondary"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="text-2xl font-bold text-foreground">Chọn Map</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MAPS.map((m) => {
          const locked = m.id > unlockedUpTo
          return (
            <button
              key={m.id}
              disabled={locked}
              onClick={() => onPick(m.id)}
              className={`group relative overflow-hidden rounded-2xl border border-border p-4 text-left transition ${
                locked ? "cursor-not-allowed opacity-60" : "hover:border-primary hover:shadow-lg"
              }`}
              style={{ backgroundColor: m.bg }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-white/60">Map {m.id}</div>
                  <div className="text-lg font-bold text-white">{m.name}</div>
                </div>
                {locked ? (
                  <Lock className="size-5 text-white/70" />
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${diffColor[m.difficulty]}`}>
                    {m.difficulty}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/75">{m.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">
                  <Target className="size-3" /> {m.target} điểm
                </span>
                {m.features.map((f) => (
                  <span key={f} className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white/80">
                    {f}
                  </span>
                ))}
              </div>
              {locked && (
                <div className="mt-2 text-xs text-white/60">Hoàn thành map trước để mở khóa</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
