'use client'

import { useEffect, useRef } from 'react'

type Entity = {
  id: string
  type: string
  canonical_name: string
  site_id: string | null
  mention_count: number
}

type Relationship = {
  id: string
  src: string
  dst: string
  type: string
}

const TYPE_COLOR: Record<string, string> = {
  Organization: 'var(--color-accent)',
  Place: 'var(--color-blue)',
  Person: 'var(--color-rose)',
  Concept: 'var(--color-violet)',
  Claim: 'var(--color-amber)',
  Source: 'var(--color-text-3)',
  Metric: 'var(--color-text-2)',
}

/**
 * Minimal force-directed-esque layout using deterministic positioning
 * based on hash of entity IDs. Good enough for <500 nodes; swap for
 * cosmograph or react-force-graph-2d when we need real simulation.
 */
export function GraphCanvas({
  entities,
  relationships,
  centerId,
}: {
  entities: Entity[]
  relationships: Relationship[]
  centerId: string
}) {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Radial layout — center in the middle, others around it by hash
  const W = 100
  const H = 100
  const center = entities.find((e) => e.id === centerId)
  const outer = entities.filter((e) => e.id !== centerId)
  const positions = new Map<string, { x: number; y: number }>()
  if (center) positions.set(center.id, { x: 50, y: 50 })
  outer.forEach((e, i) => {
    const angle = (i / outer.length) * Math.PI * 2
    const radius = 32 + (e.mention_count % 4) * 3
    positions.set(e.id, {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    })
  })

  return (
    <div
      ref={canvasRef}
      className="relative"
      style={{
        background: 'var(--color-bg-subtle)',
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-line-2) 1px, transparent 0)',
        backgroundSize: '20px 20px',
        height: 480,
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        {relationships.map((r) => {
          const a = positions.get(r.src)
          const b = positions.get(r.dst)
          if (!a || !b) return null
          return (
            <line
              key={r.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--color-line-3)"
              strokeWidth={0.25}
              strokeDasharray="1 1"
            />
          )
        })}
      </svg>
      {entities.map((e) => {
        const pos = positions.get(e.id)
        if (!pos) return null
        const isCenter = e.id === centerId
        const size = isCenter ? 54 : 36 + Math.min(12, e.mention_count * 2)
        const color = TYPE_COLOR[e.type] ?? 'var(--color-text-3)'
        return (
          <div
            key={e.id}
            title={`${e.type}: ${e.canonical_name} (×${e.mention_count})`}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%,-50%)',
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'var(--color-bg-elev)',
              border: `2px solid ${color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              padding: 4,
            }}
          >
            <div
              className="text-[10px] font-medium text-center leading-tight"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {e.canonical_name.length > 14
                ? e.canonical_name.slice(0, 12) + '…'
                : e.canonical_name}
            </div>
            {e.site_id === null && (
              <div
                className="absolute w-2 h-2 rounded-full"
                style={{
                  top: -2,
                  right: -2,
                  background: 'var(--color-accent)',
                  border: '2px solid #fff',
                }}
                title="global entity"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
