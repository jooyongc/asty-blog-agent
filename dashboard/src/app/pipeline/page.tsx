import { listSites, readDeeplUsage } from '@/lib/sites'
import { AgentAvatar, Card, CardHead, Chip, Metric, type AgentId } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { RunButton } from './run-button'

export const dynamic = 'force-dynamic'

const DEEPL_MONTHLY_CAP = 500_000

type Agent = { id: AgentId; label: string; model: string; role: string }

const AGENTS: Agent[] = [
  { id: 'director',  label: 'director',  model: 'Haiku 4.5', role: 'Direction → 3 ranked topics' },
  { id: 'seo',       label: 'seo',       model: 'Haiku 4.5', role: 'Striking-distance keyword research' },
  { id: 'writer',    label: 'writer',    model: 'Haiku 4.5', role: 'Research + draft + self-edit' },
  { id: 'verifier',  label: 'verifier',  model: 'Haiku 4.5', role: 'Fact-check claims · blocks on contradiction' },
  { id: 'translate', label: 'translate', model: 'DeepL',     role: 'EN → JA / ZH-hans with glossary' },
  { id: 'packager',  label: 'packager',  model: 'Haiku 4.5', role: 'Multi-lang SEO metadata + schema' },
  { id: 'linker',    label: 'linker',    model: 'Graph',     role: 'CO_OCCURS internal links (3–5/article)' },
  { id: 'publish',   label: 'publish',   model: 'HTTP',      role: 'POST to site API + graph extraction' },
]

const STAGES = [
  { id: 'director',  agent: 'director' as AgentId,  title: '디렉션 → 주제',  eta: '~15s' },
  { id: 'seo',       agent: 'seo' as AgentId,       title: 'SEO 리서치',      eta: '~20s' },
  { id: 'writer',    agent: 'writer' as AgentId,    title: '본문 작성',       eta: '~90s' },
  { id: 'verifier',  agent: 'verifier' as AgentId,  title: '팩트 체크',       eta: '~25s' },
  { id: 'translate', agent: 'translate' as AgentId, title: 'JA / ZH 번역',    eta: '~20s' },
  { id: 'packager',  agent: 'packager' as AgentId,  title: '메타 + 스키마',    eta: '~25s' },
  { id: 'linker',    agent: 'linker' as AgentId,    title: '내부 링크',       eta: '~5s' },
]

export default async function PipelinePage() {
  const sites = await listSites()
  const deepl = readDeeplUsage()
  const thisMonth = new Date().toISOString().slice(0, 7)
  const deeplActive = deepl && deepl.month === thisMonth
  const pct = deepl && deeplActive ? Math.round((deepl.chars / DEEPL_MONTHLY_CAP) * 100) : 0

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">파이프라인</h1>
        <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
          에이전트 런타임 상태, DeepL 사용량, 주간 실행 트리거.
        </p>
      </header>

      <RunButton />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
        <Metric
          label="DeepL (월)"
          value={deeplActive ? `${pct}%` : '—'}
          delta={
            deeplActive
              ? `${deepl!.chars.toLocaleString()} / ${DEEPL_MONTHLY_CAP.toLocaleString()}`
              : '사용량 파일 없음'
          }
          deltaKind={pct > 80 ? 'warn' : undefined}
          bar={deeplActive ? deepl!.chars / DEEPL_MONTHLY_CAP : 0}
        />
        <Metric label="이번 달 런 횟수" value={deeplActive ? deepl!.runs : '—'} delta="DeepL translate" />
        <Metric label="사이트" value={sites.length} />
        <Metric label="이번 달" value={thisMonth} />
      </section>

      {/* Pipeline stages visualization */}
      <Card className="mb-4">
        <CardHead>
          <div className="text-[13.5px] font-semibold">파이프라인 단계</div>
          <Chip kind="ghost">Phase 7~12 기준</Chip>
          <div className="flex-1" />
          <span className="text-[11.5px] text-[color:var(--color-text-3)]">
            Writer → Verifier → Translate → Packager → Linker
          </span>
        </CardHead>
        <div className="p-5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                  <AgentAvatar agent={s.agent} size={28} />
                  <div className="text-[12px] font-medium">{s.title}</div>
                  <div className="text-[11px] text-[color:var(--color-text-3)] font-mono">
                    {s.eta}
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <Icons.Chevron size={14} />
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHead>
          <div className="text-[13.5px] font-semibold">에이전트</div>
        </CardHead>
        <div className="grid md:grid-cols-4 grid-cols-1">
          {AGENTS.map((a, i) => (
            <div
              key={a.id}
              className={`px-5 py-4 flex flex-col gap-1.5 min-w-0 ${
                i % 4 !== 0 ? 'md:border-l' : ''
              } ${i >= 4 ? 'md:border-t' : ''} border-[color:var(--color-line)]`}
            >
              <div className="flex items-center gap-2">
                <AgentAvatar agent={a.id} />
                <div className="font-medium text-[13px]">{a.label}</div>
              </div>
              <div className="text-[11.5px] text-[color:var(--color-text-3)] leading-snug truncate">
                {a.role}
              </div>
              <div className="text-[11px] text-[color:var(--color-text-4)] font-mono">
                {a.model}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <CardHead>
          <div className="text-[13.5px] font-semibold">사이트 목록</div>
        </CardHead>
        <table className="w-full text-[13px]">
          <thead className="bg-[color:var(--color-bg-subtle)] text-[11.5px] uppercase tracking-wider text-[color:var(--color-text-3)]">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Site</th>
              <th className="text-left px-4 py-2.5 font-medium">URL</th>
              <th className="text-left px-4 py-2.5 font-medium">Canonical</th>
              <th className="text-left px-4 py-2.5 font-medium">Languages</th>
              <th className="text-left px-4 py-2.5 font-medium">Categories</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.site_id} className="border-t border-[color:var(--color-line)]">
                <td className="px-4 py-3 font-medium">{s.site_id}</td>
                <td className="px-4 py-3">
                  <a
                    href={s.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] text-[color:var(--color-blue)] hover:underline"
                  >
                    {s.site_url.replace(/^https?:\/\//, '')}
                  </a>
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)]">
                  {s.canonical_lang}
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)]">
                  {s.languages.join(', ')}
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[color:var(--color-text-3)]">
                  {s.categories.length}
                </td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr>
                <td colSpan={5} className="py-5 text-center text-[11.5px] text-[color:var(--color-text-4)]">
                  No sites configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="mb-4">
        <CardHead>
          <div className="text-[13.5px] font-semibold">외부 링크</div>
        </CardHead>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {[
            {
              title: 'Anthropic usage',
              href: 'https://console.anthropic.com/usage',
              hint: 'Check Haiku spend',
            },
            {
              title: 'DeepL account',
              href: 'https://www.deepl.com/account/usage',
              hint: 'Account-level quota',
            },
            {
              title: 'GitHub Actions',
              href: 'https://github.com/jooyongc/asty-blog-agent/actions',
              hint: 'Weekly pipeline runs',
            },
          ].map((x) => (
            <a
              key={x.href}
              href={x.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-[color:var(--color-line)] rounded-[10px] p-4 hover:bg-[color:var(--color-bg-hover)] transition"
            >
              <div className="font-medium text-[13px] flex items-center gap-1.5">
                {x.title} <Icons.External size={11} />
              </div>
              <div className="text-[11.5px] text-[color:var(--color-text-3)] mt-1">{x.hint}</div>
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead>
          <div className="text-[13.5px] font-semibold">주간 트리거</div>
        </CardHead>
        <div className="p-5 text-[12.5px] text-[color:var(--color-text-2)] space-y-1.5">
          <p>
            <code className="font-mono bg-[color:var(--color-bg-muted)] px-1 rounded">/weekly</code>{' '}
            커맨드는 일요일 21:00 KST GitHub Actions로 자동 실행. 수동 트리거도 가능.
          </p>
          <div className="text-[color:var(--color-text-3)] text-[11.5px]">
            • 스케줄:{' '}
            <code className="font-mono bg-[color:var(--color-bg-muted)] px-1 rounded">
              0 12 * * 0
            </code>{' '}
            (Sunday 12:00 UTC)
          </div>
          <div className="text-[color:var(--color-text-3)] text-[11.5px]">
            • 주간 서브에이전트: 12 호출 (3 seo + 3 writer + 3 verifier + 3 packager)
          </div>
          <div className="text-[color:var(--color-text-3)] text-[11.5px]">
            • 목표 비용: ≤ $5/site/월 (Lean 프로파일)
          </div>
        </div>
      </Card>
    </div>
  )
}
