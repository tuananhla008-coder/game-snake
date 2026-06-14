export const GRID_SIZE = 24

export type Cell = { x: number; y: number }

export type FoodKind = "apple" | "banana" | "diamond" | "gold"
export type PowerKind = "speed" | "shield" | "clock"

export type GameMode = "classic" | "timeAttack" | "survival"

export const FOOD_INFO: Record<
  FoodKind,
  { points: number; color: string; glyph: string; label: string; weight: number }
> = {
  apple: { points: 10, color: "#ef4444", glyph: "🍎", label: "Táo đỏ", weight: 60 },
  banana: { points: 15, color: "#facc15", glyph: "🍌", label: "Chuối", weight: 25 },
  gold: { points: 30, color: "#f59e0b", glyph: "⭐", label: "Vàng", weight: 10 },
  diamond: { points: 50, color: "#22d3ee", glyph: "💎", label: "Kim cương", weight: 5 },
}

export const POWER_INFO: Record<
  PowerKind,
  { color: string; glyph: string; label: string; desc: string }
> = {
  speed: { color: "#a3e635", glyph: "⚡", label: "Tăng tốc", desc: "Tăng tốc 5 giây" },
  shield: { color: "#38bdf8", glyph: "🛡", label: "Khiên", desc: "Miễn nhiễm va chạm 10 giây" },
  clock: { color: "#c084fc", glyph: "⏰", label: "Đồng hồ", desc: "Cộng thêm thời gian" },
}

export type Difficulty = "Dễ" | "Trung Bình" | "Khó" | "Rất Khó"

export type MapConfig = {
  id: number
  name: string
  difficulty: Difficulty
  description: string
  target: number
  baseSpeed: number // ms per tick (lower = faster)
  bg: string
  grid: string
  accent: string
  features: string[]
  /** static obstacles count */
  obstacles: number
  /** moving obstacles (cars) count */
  movers: number
  /** number of portal pairs */
  portals: number
}

export const MAPS: MapConfig[] = [
  {
    id: 1,
    name: "Đồng Cỏ",
    difficulty: "Dễ",
    description: "Không có chướng ngại vật. Dành cho người mới.",
    target: 100,
    baseSpeed: 150,
    bg: "#14532d",
    grid: "#16602f",
    accent: "#4ade80",
    features: ["Trống trải", "An toàn"],
    obstacles: 0,
    movers: 0,
    portals: 0,
  },
  {
    id: 2,
    name: "Rừng Xanh",
    difficulty: "Dễ",
    description: "Xuất hiện cây cối. Một số lối đi hẹp.",
    target: 150,
    baseSpeed: 140,
    bg: "#064e3b",
    grid: "#075c45",
    accent: "#34d399",
    features: ["Cây cối", "Lối hẹp"],
    obstacles: 14,
    movers: 0,
    portals: 0,
  },
  {
    id: 3,
    name: "Sa Mạc",
    difficulty: "Trung Bình",
    description: "Đá xuất hiện ngẫu nhiên. Tốc độ tăng nhanh hơn.",
    target: 200,
    baseSpeed: 120,
    bg: "#78350f",
    grid: "#8a4012",
    accent: "#fbbf24",
    features: ["Đá ngẫu nhiên", "Tốc độ cao"],
    obstacles: 22,
    movers: 0,
    portals: 0,
  },
  {
    id: 4,
    name: "Núi Lửa",
    difficulty: "Trung Bình",
    description: "Hố dung nham và khu vực nguy hiểm.",
    target: 250,
    baseSpeed: 115,
    bg: "#450a0a",
    grid: "#5c1111",
    accent: "#f97316",
    features: ["Dung nham", "Nguy hiểm"],
    obstacles: 28,
    movers: 0,
    portals: 0,
  },
  {
    id: 5,
    name: "Thành Phố",
    difficulty: "Khó",
    description: "Xe di chuyển ngẫu nhiên. Nhiều vật cản.",
    target: 300,
    baseSpeed: 110,
    bg: "#1e293b",
    grid: "#27364b",
    accent: "#60a5fa",
    features: ["Xe di chuyển", "Vật cản"],
    obstacles: 18,
    movers: 4,
    portals: 0,
  },
  {
    id: 6,
    name: "Phòng Thí Nghiệm",
    difficulty: "Khó",
    description: "Cổng dịch chuyển (Portal) và bẫy điện.",
    target: 400,
    baseSpeed: 100,
    bg: "#0c1e2b",
    grid: "#123040",
    accent: "#22d3ee",
    features: ["Portal", "Bẫy điện"],
    obstacles: 24,
    movers: 0,
    portals: 1,
  },
  {
    id: 7,
    name: "Không Gian",
    difficulty: "Rất Khó",
    description: "Portal liên tục và tốc độ cực cao.",
    target: 500,
    baseSpeed: 80,
    bg: "#0b0b1f",
    grid: "#15152e",
    accent: "#a78bfa",
    features: ["Portal liên tục", "Tốc độ cực cao"],
    obstacles: 16,
    movers: 3,
    portals: 2,
  },
]

export const MODE_INFO: Record<GameMode, { label: string; desc: string }> = {
  classic: { label: "Classic", desc: "Rắn truyền thống, không giới hạn thời gian." },
  timeAttack: { label: "Time Attack", desc: "Giới hạn 3 phút, đạt điểm cao nhất." },
  survival: { label: "Survival", desc: "Tốc độ tăng liên tục, chơi đến khi thua." },
}

export const TIME_ATTACK_SECONDS = 180

/** speed multiplier based on score milestones */
export function speedMultiplier(score: number): number {
  if (score >= 500) return 0.85
  if (score >= 200) return 0.9
  if (score >= 100) return 0.95
  return 1
}

export type ScoreEntry = { score: number; mapId: number; mode: GameMode; date: number }

const LB_KEY = "snake-leaderboard-v1"

export function loadLeaderboard(): ScoreEntry[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(LB_KEY) || "[]")
  } catch {
    return []
  }
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const list = loadLeaderboard()
  list.push(entry)
  list.sort((a, b) => b.score - a.score)
  const top = list.slice(0, 10)
  localStorage.setItem(LB_KEY, JSON.stringify(top))
  return top
}

export function getBestScore(): number {
  const list = loadLeaderboard()
  return list.length ? list[0].score : 0
}
