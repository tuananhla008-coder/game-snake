"use client"

import { useCallback, useState } from "react"
import MainMenu from "@/components/main-menu"
import MapSelect from "@/components/map-select"
import LeaderboardView from "@/components/leaderboard-view"
import InstructionsView from "@/components/instructions-view"
import GameOverView from "@/components/game-over-view"
import SnakeGame, { type GameResult } from "@/components/snake-game"
import { type GameMode, saveScore } from "@/lib/game-config"

type Screen = "menu" | "maps" | "leaderboard" | "instructions" | "playing" | "over"

export default function Page() {
  const [screen, setScreen] = useState<Screen>("menu")
  const [mode, setMode] = useState<GameMode>("classic")
  const [mapId, setMapId] = useState(1)
  const [unlockedUpTo, setUnlockedUpTo] = useState(1)
  const [result, setResult] = useState<GameResult | null>(null)
  const [runKey, setRunKey] = useState(0)

  const startGame = useCallback((id: number) => {
    setMapId(id)
    setRunKey((k) => k + 1)
    setScreen("playing")
  }, [])

  const handleGameOver = useCallback((res: GameResult) => {
    saveScore({ score: res.score, mapId: res.mapId, mode: res.mode, date: Date.now() })
    if (res.won) {
      setUnlockedUpTo((u) => Math.max(u, Math.min(7, res.mapId + 1)))
    }
    setResult(res)
    setScreen("over")
  }, [])

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 py-10">
      {screen === "menu" && (
        <MainMenu
          mode={mode}
          onPickMode={setMode}
          onPlay={() => startGame(mapId)}
          onSelectMap={() => setScreen("maps")}
          onLeaderboard={() => setScreen("leaderboard")}
          onInstructions={() => setScreen("instructions")}
        />
      )}

      {screen === "maps" && (
        <MapSelect
          unlockedUpTo={unlockedUpTo}
          onBack={() => setScreen("menu")}
          onPick={(id) => startGame(id)}
        />
      )}

      {screen === "leaderboard" && <LeaderboardView onBack={() => setScreen("menu")} />}

      {screen === "instructions" && <InstructionsView onBack={() => setScreen("menu")} />}

      {screen === "playing" && (
        <SnakeGame
          key={runKey}
          mapId={mapId}
          mode={mode}
          onExit={() => setScreen("menu")}
          onGameOver={handleGameOver}
        />
      )}

      {screen === "over" && result && (
        <GameOverView
          result={result}
          onRetry={() => startGame(result.mapId)}
          onSelectMap={() => setScreen("maps")}
          onMenu={() => setScreen("menu")}
        />
      )}
    </main>
  )
}
