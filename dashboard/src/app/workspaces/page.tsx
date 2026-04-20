import { Card, CardHead, Chip } from '@/components/primitives'
import { Icons } from '@/components/icons'
import { listWorkspaces } from '@/lib/workspaces-client'
import { getActiveSiteId } from '@/lib/active-workspace'
import { WorkspaceTable } from './workspace-table'

export const dynamic = 'force-dynamic'

export default async function WorkspacesPage() {
  const [workspaces, activeId] = await Promise.all([
    listWorkspaces(),
    getActiveSiteId(),
  ])

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0">
            워크스페이스{' '}
            <Chip kind="ok" dot className="ml-1.5 align-middle">
              {workspaces.length}개 등록
            </Chip>
          </h1>
          <p className="text-[13.5px] text-[color:var(--color-text-3)] mt-1">
            각 블로그 사이트(독립 Vercel + Supabase)를 이 대시보드에서 제어합니다. API 키는 AES-256-GCM으로 암호화되어 저장됩니다.
          </p>
        </div>
      </header>

      <Card>
        <CardHead>
          <Icons.Layers size={14} />
          <div className="text-[13.5px] font-semibold">등록된 사이트</div>
          <div className="flex-1" />
          <span className="text-[11.5px] text-[color:var(--color-text-3)]">
            활성 사이트: <strong>{activeId ?? '—'}</strong>
          </span>
        </CardHead>
        <WorkspaceTable workspaces={workspaces} activeId={activeId} />
      </Card>

      <div
        className="mt-4 px-3.5 py-3 rounded-md text-[12px] leading-relaxed"
        style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-3)' }}
      >
        <div className="font-semibold text-[color:var(--color-text)] mb-1 text-[12.5px]">
          새 사이트 추가 절차
        </div>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>대상 블로그 사이트를 독립 Vercel + Supabase로 배포 (asty-cabin과 같은 구조)</li>
          <li>해당 사이트의 <code className="font-mono">AGENT_API_KEY</code>를 Vercel env에 설정 후 값을 복사</li>
          <li>위 테이블의 <strong>"+ 사이트 추가"</strong> 버튼으로 등록 (키는 암호화되어 저장됨)</li>
          <li>사이드바 워크스페이스 스위처에서 전환 후 <code className="font-mono">/direction</code>·<code className="font-mono">/queue</code>에서 운영</li>
        </ol>
      </div>
    </div>
  )
}
