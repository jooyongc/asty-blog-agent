/**
 * Reusable primitives — ported from Claude Design handoff.
 * All visual tokens come from globals.css (@theme block).
 */

'use client'

import type { CSSProperties, ReactNode } from 'react'

/* --------------------------------------------------- Chip */

type ChipKind =
  | 'ghost'
  | 'outline'
  | 'ok'
  | 'warn'
  | 'err'
  | 'en'
  | 'ja'
  | 'zh'

const CHIP_BG: Record<ChipKind, string> = {
  ghost: 'bg-[color:var(--color-bg-muted)] text-[color:var(--color-text-3)]',
  outline:
    'bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line-2)] text-[color:var(--color-text-2)]',
  ok: 'bg-[color:var(--color-ok-soft)] text-[color:var(--color-ok)]',
  warn: 'bg-[color:var(--color-warn-soft)] text-[color:var(--color-warn)]',
  err: 'bg-[color:var(--color-err-soft)] text-[color:var(--color-err)]',
  en: 'bg-[color:var(--color-lang-en-soft)] text-[color:var(--color-lang-en)]',
  ja: 'bg-[color:var(--color-lang-ja-soft)] text-[color:var(--color-lang-ja)]',
  zh: 'bg-[color:var(--color-lang-zh-soft)] text-[color:var(--color-lang-zh)]',
}

export function Chip({
  children,
  kind = 'ghost',
  dot = false,
  className = '',
  style,
}: {
  children: ReactNode
  kind?: ChipKind
  dot?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-medium tabular-nums leading-[1.5] ${CHIP_BG[kind]} ${className}`}
      style={style}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function LangChip({ lang, on = true, small = false }: { lang: 'en' | 'ja' | 'zh'; on?: boolean; small?: boolean }) {
  const label = { en: 'EN', ja: 'JA', zh: 'ZH' }[lang]
  return (
    <Chip
      kind={on ? lang : 'ghost'}
      style={small ? { fontSize: 10, padding: '1px 6px' } : undefined}
    >
      {label}
    </Chip>
  )
}

/* --------------------------------------------------- AgentAvatar */

export type AgentId =
  | 'director'
  | 'seo'
  | 'writer'
  | 'verifier'
  | 'translate'
  | 'glossary'
  | 'packager'
  | 'linker'
  | 'image'
  | 'publish'

const AGENT_LETTERS: Record<AgentId, string> = {
  director: 'D',
  seo: 'S',
  writer: 'W',
  verifier: 'V',
  translate: 'T',
  glossary: 'G',
  packager: 'P',
  linker: 'L',
  image: 'I',
  publish: 'P',
}

const AGENT_BG: Record<AgentId, string> = {
  director: 'bg-[color:var(--color-agent-director-soft)] text-[color:var(--color-agent-director)]',
  seo: 'bg-[color:var(--color-agent-seo-soft)] text-[color:var(--color-agent-seo)]',
  writer: 'bg-[color:var(--color-agent-writer-soft)] text-[color:var(--color-agent-writer)]',
  verifier: 'bg-[color:var(--color-agent-verifier-soft)] text-[color:var(--color-agent-verifier)]',
  translate: 'bg-[color:var(--color-agent-translate-soft)] text-[color:var(--color-agent-translate)]',
  glossary: 'bg-[color:var(--color-agent-glossary-soft)] text-[color:var(--color-agent-glossary)]',
  packager: 'bg-[color:var(--color-agent-packager-soft)] text-[color:var(--color-agent-packager)]',
  linker: 'bg-[color:var(--color-agent-linker-soft)] text-[color:var(--color-agent-linker)]',
  image: 'bg-[color:var(--color-agent-image-soft)] text-[color:var(--color-agent-image)]',
  publish: 'bg-[color:var(--color-agent-publish-soft)] text-[color:var(--color-agent-publish)]',
}

export function AgentAvatar({ agent, size = 22 }: { agent: AgentId; size?: number }) {
  return (
    <div
      className={`rounded-md flex items-center justify-center font-bold flex-shrink-0 ${AGENT_BG[agent]}`}
      style={{ width: size, height: size, fontSize: size * 0.48 }}
    >
      {AGENT_LETTERS[agent]}
    </div>
  )
}

/* --------------------------------------------------- Toggle */

export function Toggle({ on, onChange }: { on: boolean; onChange?: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange?.(!on)}
      className="relative w-[30px] h-[18px] rounded-full transition-colors flex-shrink-0"
      style={{
        background: on ? 'var(--color-accent)' : 'var(--color-line-2)',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: on ? 'translateX(12px)' : 'translateX(0)' }}
      />
    </button>
  )
}

/* --------------------------------------------------- Metric */

export function Metric({
  label,
  value,
  unit,
  delta,
  deltaKind,
  bar,
  icon,
}: {
  label: ReactNode
  value: ReactNode
  unit?: string
  delta?: ReactNode
  deltaKind?: 'ok' | 'warn' | 'err'
  bar?: number
  icon?: ReactNode
}) {
  const deltaColor =
    deltaKind === 'ok'
      ? 'text-[color:var(--color-ok)]'
      : deltaKind === 'warn'
      ? 'text-[color:var(--color-warn)]'
      : deltaKind === 'err'
      ? 'text-[color:var(--color-err)]'
      : 'text-[color:var(--color-text-3)]'

  return (
    <div className="bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-[14px] px-[18px] py-4 flex flex-col gap-1.5 relative overflow-hidden">
      <div className="text-xs text-[color:var(--color-text-3)] font-medium flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-[26px] font-semibold tracking-[-0.02em] tabular-nums text-[color:var(--color-text)] leading-none">
        {value}
        {unit && <small className="text-[13px] font-medium text-[color:var(--color-text-3)] ml-0.5">{unit}</small>}
      </div>
      {delta && (
        <div className={`text-xs flex items-center gap-1 mt-0.5 ${deltaColor}`}>{delta}</div>
      )}
      {bar !== undefined && (
        <div className="h-1 rounded mt-1.5 overflow-hidden bg-[color:var(--color-bg-muted)]">
          <div
            className="h-full rounded bg-[color:var(--color-accent)] transition-[width]"
            style={{ width: `${Math.min(100, bar * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------- Sparkline */

export function Sparkline({
  data,
  color = 'var(--color-accent)',
  height = 48,
  fill = true,
}: {
  data: number[]
  color?: string
  height?: number
  fill?: boolean
}) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data, 0.1)
  const min = Math.min(...data, 0)
  const W = 200
  const H = height
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 6) - 3
    return [x, y] as const
  })
  const path = pts
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1))
    .join(' ')
  const area = `${path} L ${W} ${H} L 0 ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
      {fill && <path d={area} fill={color} opacity={0.1} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} />
    </svg>
  )
}

/* --------------------------------------------------- Progress */

export function ProgressBar({
  segments,
  total,
  height = 6,
}: {
  segments: Array<{ value: number; color: string }>
  total: number
  height?: number
}) {
  return (
    <div
      className="rounded-md overflow-hidden flex bg-[color:var(--color-bg-muted)]"
      style={{ height }}
    >
      {segments.map((s, i) => (
        <div
          key={i}
          className="h-full transition-[width]"
          style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
        />
      ))}
    </div>
  )
}

/* --------------------------------------------------- Segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: ReactNode }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex bg-[color:var(--color-bg-muted)] rounded-lg p-[3px] gap-[2px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md text-[12.5px] font-medium transition ${
            value === o.value
              ? 'bg-[color:var(--color-bg-elev)] text-[color:var(--color-text)] shadow-sm'
              : 'text-[color:var(--color-text-2)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* --------------------------------------------------- Tabs */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ value: T; label: ReactNode; count?: number }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-0.5 border-b border-[color:var(--color-line)] mb-4 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3.5 py-2 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px ${
            value === t.value
              ? 'text-[color:var(--color-text)] border-[color:var(--color-text)]'
              : 'text-[color:var(--color-text-3)] border-transparent hover:text-[color:var(--color-text-2)]'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="ml-1.5 text-[color:var(--color-text-3)] tabular-nums">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* --------------------------------------------------- CostDonut */

export function CostDonut({
  spent,
  budget,
  size = 140,
}: {
  spent: number
  budget: number
  size?: number
}) {
  const pct = Math.min(1, spent / budget)
  const R = size / 2 - 10
  const C = 2 * Math.PI * R
  const color =
    pct < 0.7 ? 'var(--color-ok)' : pct < 0.9 ? 'var(--color-warn)' : 'var(--color-err)'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--color-line)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[22px] font-semibold tracking-[-0.02em] tabular-nums">
          ${spent.toFixed(2)}
        </div>
        <div className="text-[11px] text-[color:var(--color-text-3)]">of ${budget.toFixed(2)}</div>
      </div>
    </div>
  )
}

/* --------------------------------------------------- Hero placeholder */

export function HeroPlaceholder({
  kind = 'pine',
  label,
  height = 120,
}: {
  kind?: 'pine' | 'snow' | 'harvest'
  label?: string
  height?: number | string
}) {
  const palettes: Record<string, readonly [string, string, string]> = {
    pine: ['#2f6f4e', '#4c8466', '#8fa598'],
    snow: ['#a6bacc', '#d6dee6', '#f0f3f7'],
    harvest: ['#b66f1c', '#d89a55', '#eac58b'],
  }
  const [c1, c2, c3] = palettes[kind] ?? palettes.pine
  return (
    <div
      className="rounded-md relative overflow-hidden flex items-end p-2.5"
      style={{
        height: typeof height === 'number' ? height : '100%',
        minHeight: 60,
        background: `linear-gradient(160deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`,
      }}
    >
      <svg
        viewBox="0 0 200 80"
        className="absolute bottom-0 left-0 w-full"
        style={{ height: '70%', opacity: 0.35 }}
        preserveAspectRatio="none"
      >
        <path d="M0 80 L30 40 L55 60 L85 25 L120 55 L150 30 L180 50 L200 35 L200 80 Z" fill={c1} />
        <path d="M0 80 L25 60 L55 70 L90 50 L120 72 L155 55 L190 70 L200 65 L200 80 Z" fill="rgba(0,0,0,0.25)" />
      </svg>
      {label && (
        <div
          className="relative text-white text-[11px] font-medium"
          style={{ opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------- Shared card */

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] rounded-[14px] overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`px-[18px] py-3.5 border-b border-[color:var(--color-line)] flex items-center gap-2.5 ${className}`}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-[18px] ${className}`}>{children}</div>
}

/* --------------------------------------------------- Button */

export type ButtonVariant = 'default' | 'primary' | 'accent' | 'ghost' | 'icon'

export function Button({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...rest
}: {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  children?: ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantClass =
    variant === 'primary'
      ? 'bg-[color:var(--color-text)] text-white border-transparent hover:bg-black'
      : variant === 'accent'
      ? 'bg-[color:var(--color-accent)] text-white border-transparent hover:bg-[color:var(--color-accent-ink)]'
      : variant === 'ghost'
      ? 'bg-transparent border-transparent text-[color:var(--color-text-2)] hover:bg-[color:var(--color-bg-hover)]'
      : variant === 'icon'
      ? 'bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line-2)] text-[color:var(--color-text)] aspect-square p-1.5 hover:bg-[color:var(--color-bg-hover)]'
      : 'bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line-2)] text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-hover)]'
  const sizeClass =
    variant === 'icon'
      ? ''
      : size === 'sm'
      ? 'px-2 py-1 text-xs'
      : 'px-3 py-1.5 text-[13px]'
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-[7px] font-medium leading-none whitespace-nowrap transition ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
