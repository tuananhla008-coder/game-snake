"use client"

import { ArrowLeft } from "lucide-react"
import { FOOD_INFO, POWER_INFO, type FoodKind, type PowerKind } from "@/lib/game-config"

export default function InstructionsView({ onBack }: { onBack: () => void }) {
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
        <h2 className="text-2xl font-bold text-foreground">Hướng Dẫn</h2>
      </div>

      <Section title="Điều khiển">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Row k="W / ↑" v="Đi lên" />
          <Row k="S / ↓" v="Đi xuống" />
          <Row k="A / ←" v="Đi trái" />
          <Row k="D / →" v="Đi phải" />
          <Row k="Space" v="Tạm dừng" />
          <Row k="ESC" v="Về menu" />
        </div>
      </Section>

      <Section title="Thức ăn">
        <div className="flex flex-col gap-2">
          {(Object.keys(FOOD_INFO) as FoodKind[]).map((k) => {
            const f = FOOD_INFO[k]
            return (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-card-foreground">
                  <span
                    className="inline-block size-4 rounded-full"
                    style={{ backgroundColor: f.color }}
                  />
                  {f.glyph} {f.label}
                </span>
                <span className="font-mono font-semibold text-primary">+{f.points}</span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Vật phẩm đặc biệt">
        <div className="flex flex-col gap-2">
          {(Object.keys(POWER_INFO) as PowerKind[]).map((k) => {
            const p = POWER_INFO[k]
            return (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-card-foreground">
                  <span className="text-lg">{p.glyph}</span>
                  {p.label}
                </span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Cách thua">
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>Va vào thân mình</li>
          <li>Va vào tường, đá, bẫy hoặc xe</li>
          <li>Hết thời gian (chế độ Time Attack)</li>
        </ul>
      </Section>

      <Section title="Tăng độ khó">
        <p className="text-sm text-muted-foreground">
          Tốc độ tăng dần khi đạt 100, 200 và 500 điểm. Hoàn thành mục tiêu map được thưởng +100 điểm.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-1.5">
      <span className="font-mono font-semibold text-card-foreground">{k}</span>
      <span className="text-muted-foreground">{v}</span>
    </div>
  )
}
