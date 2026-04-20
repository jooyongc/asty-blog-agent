import { listSites, getSiteBearer } from '@/lib/sites'
import type { SiteConfig } from '@/lib/sites'
import { Card, CardHead, Chip, Metric } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { GraphCanvas } from './graph-canvas'

export const dynamic = 'force-dynamic'

type GraphEntity = {
  id: string
  type: string
  canonical_name: string
  aliases: string[]
  site_id: string | null
  mention_count: number
}

type GraphRelationship = {
  id: string
  src: string
  dst: string
  type: string
  post_id: string | null
  confidence: number
}

type GraphResponse = {
  center: GraphEntity | null
  entities: GraphEntity[]
  relationships: GraphRelationship[]
  stats?: { hops: number; entity_count: number; relationship_count: number }
  warning?: string
}

async function fetchSubgraph(site: SiteConfig, entity: string): Promise<GraphResponse | null> {
  let key: string
  try {
    key = await getSiteBearer(site)
  } catch {
    return null
  }
  try {
    const res = await fetch(
      `${site.site_url}/api/admin/graph/export?entity=${encodeURIComponent(entity)}&hops=2&_t=${Date.now()}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' }
    )
    if (!res.ok) return null
    return (await res.json()) as GraphResponse
  } catch {
    return null
  }
}

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; site?: string }>
}) {
  const sp = await searchParams
  const sites = await listSites()
  const site = sites.find((s) => s.site_id === sp.site) ?? sites[0] ?? null
  const entity = sp.entity ?? 'ASTY Cabin'
  const graph = site ? await fetchSubgraph(site, entity) : null

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
            그래프 탐색{' '}
            <Chip kind="ghost" className="ml-1.5 align-middle">
              Phase 8
            </Chip>
          </h1>
          <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
            {site ? (
              <>
                <b>{entity}</b> 기준 2-hop 서브그래프 · {site.site_id}
              </>
            ) : (
              '사이트가 구성되지 않았습니다'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form method="GET" className="flex items-center gap-1.5 bg-[color:var(--color-bg-muted)] rounded-lg px-2.5 py-1">
            <Icons.Search size={14} />
            <input
              name="entity"
              defaultValue={entity}
              placeholder="엔티티 이름"
              className="bg-transparent outline-none text-[13px] min-w-[180px]"
            />
            {site && <input type="hidden" name="site" value={site.site_id} />}
          </form>
        </div>
      </header>

      {!graph ? (
        <Card>
          <div className="p-10 text-center text-[13px] text-[color:var(--color-text-3)]">
            Graph API에 연결할 수 없거나 데이터가 비어있습니다.
            <div className="mt-2 text-[11.5px]">
              에이전트 레포에서{' '}
              <code className="font-mono bg-[color:var(--color-bg-muted)] px-1 rounded">
                npx tsx scripts/extract-entities.ts {'<slug>'} --force
              </code>{' '}
              실행 필요.
            </div>
          </div>
        </Card>
      ) : graph.center ? (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
            <Metric label="엔티티" value={graph.entities.length} delta="2-hop 범위" />
            <Metric label="관계" value={graph.relationships.length} />
            <Metric label="중심 엔티티 등장" value={graph.center.mention_count} unit="×" />
            <Metric label="타입" value={graph.center.type} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3.5">
            <Card>
              <CardHead>
                <div className="text-[13.5px] font-semibold">2-hop 서브그래프</div>
                <div className="flex-1" />
                <span className="text-[11px] text-[color:var(--color-text-3)]">
                  노드 {graph.entities.length} · 엣지 {graph.relationships.length}
                </span>
              </CardHead>
              <GraphCanvas
                entities={graph.entities}
                relationships={graph.relationships}
                centerId={graph.center.id}
              />
            </Card>

            <Card>
              <CardHead>
                <div className="text-[13.5px] font-semibold">{graph.center.canonical_name}</div>
                <Chip kind="ok">{graph.center.type.toLowerCase()}</Chip>
              </CardHead>
              <div className="p-[18px]">
                <div className="text-[12px] text-[color:var(--color-text-3)] mb-2.5">
                  언급 {graph.center.mention_count}회{' '}
                  {graph.center.aliases.length > 0 && (
                    <>· 별칭 {graph.center.aliases.length}개</>
                  )}
                </div>
                {graph.center.aliases.length > 0 && (
                  <>
                    <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-text-4)] mb-1">
                      Aliases
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {graph.center.aliases.slice(0, 12).map((a) => (
                        <Chip key={a} kind="outline">
                          {a}
                        </Chip>
                      ))}
                    </div>
                  </>
                )}
                <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-text-4)] mb-1.5 mt-3">
                  Connected entities
                </div>
                {graph.entities
                  .filter((e) => e.id !== graph.center!.id)
                  .slice(0, 12)
                  .map((e) => (
                    <div
                      key={e.id}
                      className="py-1.5 text-[13px] flex items-center gap-2"
                      style={{ borderBottom: '1px solid var(--color-line)' }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--color-accent)' }}
                      />
                      <span>{e.canonical_name}</span>
                      <span className="text-[11px] text-[color:var(--color-text-4)] tabular-nums font-mono">
                        {e.type}
                      </span>
                      <span className="flex-1" />
                      <span className="text-[11px] text-[color:var(--color-text-3)] font-mono tabular-nums">
                        ×{e.mention_count}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <div className="p-10 text-center text-[13px] text-[color:var(--color-text-3)]">
            <b>{entity}</b> 엔티티를 그래프에서 찾을 수 없습니다.
            {graph.warning && (
              <div className="mt-2 text-[11.5px]">{graph.warning}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
