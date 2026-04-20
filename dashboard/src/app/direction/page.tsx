import Link from 'next/link'
import { Card } from '@/components/primitives'
import { getActiveSite } from '@/lib/active-workspace'
import DirectionClient from './direction-client'

export const dynamic = 'force-dynamic'

export default async function DirectionPage() {
  const site = await getActiveSite()

  if (!site) {
    return (
      <div className="max-w-[800px]">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] m-0 mb-4">디렉션</h1>
        <Card>
          <div className="p-8 text-center">
            <div className="text-[13.5px] text-[color:var(--color-text-3)] mb-2">
              활성 워크스페이스가 없습니다.
            </div>
            <div className="text-[11.5px] text-[color:var(--color-text-4)]">
              <Link href="/workspaces" className="underline text-[color:var(--color-blue)]">
                /workspaces
              </Link>
              에서 첫 사이트를 추가하세요.
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return <DirectionClient siteId={site.site_id} siteLabel={site.site_id} />
}
