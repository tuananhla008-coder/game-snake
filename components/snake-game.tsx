"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  GRID_SIZE,
  type Cell,
  type FoodKind,
  type PowerKind,
  type GameMode,
  type MapConfig,
  FOOD_INFO,
  POWER_INFO,
  MAPS,
  MODE_INFO,
  TIME_ATTACK_SECONDS,
  speedMultiplier,
} from "@/lib/game-config"
import { Pause, Play, LogOut, Shield, Zap, Clock, Trophy } from "lucide-react"

export type GameResult = {
  score: number
  durationMs: number
  foodEaten: number
  mapId: number
  mode: GameMode
  won: boolean
}

type Dir = { x: number; y: number }
type Food = Cell & { kind: FoodKind }
type Power = Cell & { kind: PowerKind }
type Portal = { a: Cell; b: Cell }
type Mover = Cell & { dir: Dir }

const key = (c: Cell) => `${c.x},${c.y}`
const eq = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y

function randCell(blocked: Set<string>): Cell {
  let c: Cell
  let guard = 0
  do {
    c = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }
    guard++
  } while (blocked.has(key(c)) && guard < 500)
  return c
}

function pickFoodKind(): FoodKind {
  const entries = Object.entries(FOOD_INFO) as [FoodKind, (typeof FOOD_INFO)[FoodKind]][]
  const total = entries.reduce((s, [, v]) => s + v.weight, 0)
  let r = Math.random() * total
  for (const [k, v] of entries) {
    if (r < v.weight) return k
    r -= v.weight
  }
  return "apple"
}

function buildObstacles(map: MapConfig): { obstacles: Set<string>; portals: Portal[]; movers: Mover[] } {
  const obstacles = new Set<string>()
  const reserved = new Set<string>()
  // keep center clear for snake start
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      reserved.add(key({ x: Math.floor(GRID_SIZE / 2) + dx, y: Math.floor(GRID_SIZE / 2) + dy }))
    }
  }
  for (let i = 0; i < map.obstacles; i++) {
    const c = randCell(new Set([...obstacles, ...reserved]))
    obstacles.add(key(c))
  }
  const portals: Portal[] = []
  for (let i = 0; i < map.portals; i++) {
    const a = randCell(new Set([...obstacles, ...reserved]))
    const b = randCell(new Set([...obstacles, ...reserved, key(a)]))
    portals.push({ a, b })
  }
  const movers: Mover[] = []
  const dirs: Dir[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]
  for (let i = 0; i < map.movers; i++) {
    const c = randCell(new Set([...obstacles, ...reserved]))
    movers.push({ ...c, dir: dirs[Math.floor(Math.random() * dirs.length)] })
  }
  return { obstacles, portals, movers }
}

export default function SnakeGame({
  mapId,
  mode,
  onExit,
  onGameOver,
}: {
  mapId: number
  mode: GameMode
  onExit: () => void
  onGameOver: (result: GameResult) => void
}) {
  const map = MAPS.find((m) => m.id === mapId) ?? MAPS[0]

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paused, setPaused] = useState(false)
  const [score, setScore] = useState(0)
  const [length, setLength] = useState(3)
  const [foodEaten, setFoodEaten] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_ATTACK_SECONDS)
  const [completed, setCompleted] = useState(false)
  const [activePowers, setActivePowers] = useState<{ shield: number; speed: number }>({
    shield: 0,
    speed: 0,
  })

  // mutable game state
  const game = useRef({
    snake: [] as Cell[],
    dir: { x: 1, y: 0 } as Dir,
    nextDir: { x: 1, y: 0 } as Dir,
    food: null as Food | null,
    power: null as Power | null,
    powerTimer: 0,
    obstacles: new Set<string>(),
    portals: [] as Portal[],
    movers: [] as Mover[],
    score: 0,
    foodEaten: 0,
    startTime: 0,
    shieldUntil: 0,
    speedUntil: 0,
    extraSpeedFactor: 1, // survival ramp
    over: false,
    completedAwarded: false,
  })

  const paushedRef = useRef(false)
  paushedRef.current = paused

  const finishGame = useCallback(
    (won: boolean) => {
      const g = game.current
      if (g.over) return
      g.over = true
      onGameOver({
        score: g.score,
        durationMs: Date.now() - g.startTime,
        foodEaten: g.foodEaten,
        mapId,
        mode,
        won,
      })
    },
    [mapId, mode, onGameOver],
  )

  // init
  useEffect(() => {
    const g = game.current
    const mid = Math.floor(GRID_SIZE / 2)
    g.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ]
    g.dir = { x: 1, y: 0 }
    g.nextDir = { x: 1, y: 0 }
    const built = buildObstacles(map)
    g.obstacles = built.obstacles
    g.portals = built.portals
    g.movers = built.movers
    g.score = 0
    g.foodEaten = 0
    g.startTime = Date.now()
    g.shieldUntil = 0
    g.speedUntil = 0
    g.extraSpeedFactor = 1
    g.over = false
    g.completedAwarded = false
    g.powerTimer = 0
    g.power = null
    spawnFood()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId, mode])

  const blockedSet = useCallback(() => {
    const g = game.current
    const s = new Set<string>()
    g.snake.forEach((c) => s.add(key(c)))
    g.obstacles.forEach((o) => s.add(o))
    g.portals.forEach((p) => {
      s.add(key(p.a))
      s.add(key(p.b))
    })
    if (g.food) s.add(key(g.food))
    if (g.power) s.add(key(g.power))
    return s
  }, [])

  const spawnFood = useCallback(() => {
    const g = game.current
    const c = randCell(blockedSet())
    g.food = { ...c, kind: pickFoodKind() }
  }, [blockedSet])

  const maybeSpawnPower = useCallback(() => {
    const g = game.current
    if (g.power) return
    if (Math.random() < 0.22) {
      const kinds: PowerKind[] = mode === "timeAttack" ? ["speed", "shield", "clock"] : ["speed", "shield"]
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      const c = randCell(blockedSet())
      g.power = { ...c, kind }
      g.powerTimer = 0
    }
  }, [blockedSet, mode])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = game.current
      const k = e.key.toLowerCase()
      if (k === " " || k === "spacebar") {
        e.preventDefault()
        setPaused((p) => !p)
        return
      }
      if (k === "escape") {
        onExit()
        return
      }
      let nd: Dir | null = null
      if (k === "arrowup" || k === "w") nd = { x: 0, y: -1 }
      else if (k === "arrowdown" || k === "s") nd = { x: 0, y: 1 }
      else if (k === "arrowleft" || k === "a") nd = { x: -1, y: 0 }
      else if (k === "arrowright" || k === "d") nd = { x: 1, y: 0 }
      if (nd) {
        e.preventDefault()
        // prevent reversing
        if (nd.x === -g.dir.x && nd.y === -g.dir.y) return
        g.nextDir = nd
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onExit])

  const setDir = useCallback((nd: Dir) => {
    const g = game.current
    if (nd.x === -g.dir.x && nd.y === -g.dir.y) return
    g.nextDir = nd
  }, [])

  // step
  const step = useCallback(() => {
    const g = game.current
    if (g.over) return
    const now = Date.now()
    const shielded = now < g.shieldUntil

    // move cars
    g.movers = g.movers.map((m) => {
      let nx = m.x + m.dir.x
      let ny = m.y + m.dir.y
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE || g.obstacles.has(key({ x: nx, y: ny }))) {
        // reverse
        m.dir = { x: -m.dir.x, y: -m.dir.y }
        nx = m.x + m.dir.x
        ny = m.y + m.dir.y
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
          nx = m.x
          ny = m.y
        }
      }
      return { ...m, x: nx, y: ny }
    })

    g.dir = g.nextDir
    let head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y }

    // wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      if (shielded) {
        head = { x: (head.x + GRID_SIZE) % GRID_SIZE, y: (head.y + GRID_SIZE) % GRID_SIZE }
      } else {
        finishGame(false)
        return
      }
    }

    // portal
    for (const p of g.portals) {
      if (eq(head, p.a)) {
        head = { ...p.b }
        break
      }
      if (eq(head, p.b)) {
        head = { ...p.a }
        break
      }
    }

    // obstacle / mover / self collision
    const hitObstacle = g.obstacles.has(key(head))
    const hitMover = g.movers.some((m) => eq(m, head))
    const hitSelf = g.snake.some((c, i) => i > 0 && eq(c, head))
    if ((hitObstacle || hitMover || hitSelf) && !shielded) {
      finishGame(false)
      return
    }

    g.snake.unshift(head)

    // eat food
    let grew = false
    if (g.food && eq(head, g.food)) {
      const info = FOOD_INFO[g.food.kind]
      g.score += info.points
      g.foodEaten += 1
      grew = true
      spawnFood()
      maybeSpawnPower()
    }

    // eat power
    if (g.power && eq(head, g.power)) {
      const kind = g.power.kind
      if (kind === "shield") g.shieldUntil = now + 10000
      else if (kind === "speed") g.speedUntil = now + 5000
      else if (kind === "clock") setTimeLeft((t) => t + 15)
      g.power = null
    }

    if (!grew) g.snake.pop()

    // power lifetime on board (~6s)
    if (g.power) {
      g.powerTimer += 1
      if (g.powerTimer > 60) {
        g.power = null
        g.powerTimer = 0
      }
    }

    // map completion bonus
    if (!g.completedAwarded && g.score >= map.target) {
      g.completedAwarded = true
      g.score += 100
      setCompleted(true)
      if (mode === "classic") {
        // award and end with win
        finishGame(true)
        return
      }
    }

    // survival ramp
    if (mode === "survival") {
      g.extraSpeedFactor = Math.max(0.45, 1 - g.foodEaten * 0.015)
    }

    // sync UI state
    setScore(g.score)
    setLength(g.snake.length)
    setFoodEaten(g.foodEaten)
    setElapsed(now - g.startTime)
    setActivePowers({
      shield: Math.max(0, Math.ceil((g.shieldUntil - now) / 1000)),
      speed: Math.max(0, Math.ceil((g.speedUntil - now) / 1000)),
    })
  }, [finishGame, map.target, maybeSpawnPower, mode, spawnFood])

  // game loop
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      const g = game.current
      if (g.over) return
      const dt = t - last
      last = t
      if (paushedRef.current) {
        return
      }
      const now = Date.now()
      const boost = now < g.speedUntil ? 0.55 : 1
      const interval = map.baseSpeed * speedMultiplier(g.score) * boost * g.extraSpeedFactor
      acc += dt
      while (acc >= interval) {
        acc -= interval
        step()
        if (g.over) break
      }
      draw()
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, map.baseSpeed])

  // time attack countdown
  useEffect(() => {
    if (mode !== "timeAttack") return
    const id = setInterval(() => {
      if (paushedRef.current || game.current.over) return
      setTimeLeft((t) => {
        if (t <= 1) {
          finishGame(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [mode, finishGame])

  // drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const size = canvas.width
    const cell = size / GRID_SIZE
    const g = game.current
    const now = Date.now()

    ctx.fillStyle = map.bg
    ctx.fillRect(0, 0, size, size)

    // grid
    ctx.strokeStyle = map.grid
    ctx.lineWidth = 1
    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cell, 0)
      ctx.lineTo(i * cell, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cell)
      ctx.lineTo(size, i * cell)
      ctx.stroke()
    }

    const rect = (c: Cell, color: string, pad = 1, radius = 4) => {
      ctx.fillStyle = color
      const x = c.x * cell + pad
      const y = c.y * cell + pad
      const w = cell - pad * 2
      ctx.beginPath()
      ctx.roundRect(x, y, w, w, radius)
      ctx.fill()
    }

    // obstacles
    g.obstacles.forEach((o) => {
      const [x, y] = o.split(",").map(Number)
      rect({ x, y }, "rgba(0,0,0,0.55)", 1, 3)
      ctx.strokeStyle = "rgba(255,255,255,0.12)"
      ctx.lineWidth = 1
      ctx.strokeRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4)
    })

    // portals
    g.portals.forEach((p, i) => {
      const col = i % 2 === 0 ? "#22d3ee" : "#f472b6"
      ;[p.a, p.b].forEach((c) => {
        ctx.fillStyle = col
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.arc(c.x * cell + cell / 2, c.y * cell + cell / 2, cell / 2.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = map.bg
        ctx.beginPath()
        ctx.arc(c.x * cell + cell / 2, c.y * cell + cell / 2, cell / 4.5, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // movers (cars)
    g.movers.forEach((m) => {
      rect(m, "#60a5fa", 1, 3)
      ctx.fillStyle = "rgba(255,255,255,0.6)"
      ctx.fillRect(m.x * cell + cell * 0.25, m.y * cell + cell * 0.3, cell * 0.5, cell * 0.18)
    })

    // food
    if (g.food) {
      const info = FOOD_INFO[g.food.kind]
      rect(g.food, info.color, cell * 0.18, cell / 2)
      ctx.fillStyle = "rgba(255,255,255,0.85)"
      ctx.beginPath()
      ctx.arc(g.food.x * cell + cell * 0.36, g.food.y * cell + cell * 0.36, cell * 0.08, 0, Math.PI * 2)
      ctx.fill()
    }

    // power-up
    if (g.power) {
      const info = POWER_INFO[g.power.kind]
      const pulse = 0.5 + Math.sin(now / 150) * 0.15
      ctx.globalAlpha = 0.85
      rect(g.power, info.color, cell * 0.12, cell / 2)
      ctx.globalAlpha = 1
      ctx.fillStyle = "rgba(0,0,0,0.65)"
      ctx.font = `${cell * 0.6}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.globalAlpha = pulse + 0.35
      ctx.fillText(info.glyph, g.power.x * cell + cell / 2, g.power.y * cell + cell / 2 + 1)
      ctx.globalAlpha = 1
    }

    // snake
    const shielded = now < g.shieldUntil
    g.snake.forEach((c, i) => {
      const head = i === 0
      let color = head ? map.accent : "#86efac"
      if (i > 0) {
        const t = i / g.snake.length
        color = `oklch(${0.78 - t * 0.18} 0.17 145)`
      }
      rect(c, head ? map.accent : color, head ? 0.5 : 1.5, head ? 6 : 4)
      if (head) {
        ctx.fillStyle = "#0b1f12"
        const ex = c.x * cell
        const ey = c.y * cell
        const off = cell * 0.26
        ctx.beginPath()
        ctx.arc(ex + cell / 2 - off + g.dir.x * 3, ey + cell / 2 - off + g.dir.y * 2, cell * 0.09, 0, Math.PI * 2)
        ctx.arc(ex + cell / 2 + off + g.dir.x * 3, ey + cell / 2 - off + g.dir.y * 2, cell * 0.09, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    if (shielded) {
      const h = g.snake[0]
      ctx.strokeStyle = "#38bdf8"
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6 + Math.sin(now / 120) * 0.3
      ctx.beginPath()
      ctx.arc(h.x * cell + cell / 2, h.y * cell + cell / 2, cell * 0.7, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }, [map])

  // initial draw
  useEffect(() => {
    draw()
  }, [draw])

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  }

  const progress = Math.min(100, Math.round((score / map.target) * 100))

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      {/* HUD */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Map {map.id}</span>
          <span className="font-semibold text-card-foreground">{map.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Điểm</div>
            <div className="font-mono text-xl font-bold text-primary">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Dài</div>
            <div className="font-mono text-xl font-bold text-card-foreground">{length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{mode === "timeAttack" ? "Còn lại" : "Thời gian"}</div>
            <div className="font-mono text-xl font-bold text-card-foreground">
              {mode === "timeAttack" ? fmtTime(timeLeft * 1000) : fmtTime(elapsed)}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg border border-border bg-secondary p-2 text-secondary-foreground transition hover:bg-muted"
            aria-label={paused ? "Tiếp tục" : "Tạm dừng"}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <button
            onClick={onExit}
            className="rounded-lg border border-border bg-secondary p-2 text-secondary-foreground transition hover:bg-muted"
            aria-label="Thoát ra menu"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* progress + powers */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Mục tiêu: {map.target}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex gap-2">
          {activePowers.shield > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-1 text-xs font-medium text-sky-300">
              <Shield className="size-3" /> {activePowers.shield}s
            </span>
          )}
          {activePowers.speed > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-lime-500/20 px-2 py-1 text-xs font-medium text-lime-300">
              <Zap className="size-3" /> {activePowers.speed}s
            </span>
          )}
        </div>
      </div>

      {/* canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl">
        <canvas ref={canvasRef} width={576} height={576} className="block aspect-square w-full" />

        {completed && mode !== "classic" && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 animate-pulse rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-lg">
            <Trophy className="mr-1 inline size-4" /> Hoàn thành map! +100
          </div>
        )}

        {paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/85 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-foreground">Tạm Dừng</h2>
            <p className="text-sm text-muted-foreground">{MODE_INFO[mode].label} · {map.name}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPaused(false)}
                className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Tiếp tục
              </button>
              <button
                onClick={onExit}
                className="rounded-xl border border-border bg-secondary px-6 py-2.5 font-semibold text-secondary-foreground transition hover:bg-muted"
              >
                Thoát
              </button>
            </div>
          </div>
        )}
      </div>

      {/* mobile dpad */}
      <div className="mx-auto grid grid-cols-3 gap-2 sm:hidden">
        <span />
        <DPad label="▲" onClick={() => setDir({ x: 0, y: -1 })} />
        <span />
        <DPad label="◀" onClick={() => setDir({ x: -1, y: 0 })} />
        <DPad label="▼" onClick={() => setDir({ x: 0, y: 1 })} />
        <DPad label="▶" onClick={() => setDir({ x: 1, y: 0 })} />
      </div>

      <p className="hidden text-center text-xs text-muted-foreground sm:block">
        Điều khiển: W A S D hoặc phím mũi tên · Space để tạm dừng · ESC về menu
      </p>
    </div>
  )
}

function DPad({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex size-16 items-center justify-center rounded-xl border border-border bg-secondary text-2xl text-secondary-foreground active:bg-primary active:text-primary-foreground"
    >
      {label}
    </button>
  )
}
