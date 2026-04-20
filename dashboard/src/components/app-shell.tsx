'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Icons, type IconName } from './icons'
import { WorkspaceSwitcher } from './workspace-switcher'
import type { Workspace } from '@/lib/workspaces-client'

/* ---- Navigation model (mirrors design-source/components/Shell.jsx) ---- */

type NavItem = {
  href: string
  label: string
  icon: IconName
  badge?: string | null
}

type NavGroup = {
  group: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    group: '워크스페이스',
    items: [
      { href: '/', label: '개요', icon: 'Home' },
      { href: '/direction', label: '디렉션', icon: 'Sparkle', badge: 'new' },
      { href: '/pipeline', label: '파이프라인', icon: 'Flow', badge: 'live' },
    ],
  },
  {
    group: '콘텐츠',
    items: [
      { href: '/queue', label: '승인 대기열', icon: 'Check', badge: 'ph.9' },
      { href: '/sites', label: '사이트', icon: 'Layers' },
    ],
  },
  {
    group: '인텔리전스',
    items: [
      { href: '/graph', label: '그래프', icon: 'Flow', badge: 'ph.8' },
      { href: '/gsc', label: 'Search Console', icon: 'Chart', badge: 'ph.10' },
      { href: '/portfolio', label: '포트폴리오', icon: 'Layers', badge: 'ph.12' },
    ],
  },
  {
    group: '시스템',
    items: [
      { href: '/workspaces', label: '워크스페이스', icon: 'Layers', badge: 'new' },
      { href: '/reports', label: '리포트', icon: 'Clock' },
    ],
  },
]

export const ROUTE_TITLES: Record<string, string> = {
  '/': '개요',
  '/direction': '디렉션',
  '/pipeline': '파이프라인',
  '/queue': '승인 대기열',
  '/sites': '사이트',
  '/graph': '그래프 탐색',
  '/gsc': 'Search Console',
  '/portfolio': '포트폴리오',
  '/workspaces': '워크스페이스',
  '/reports': '리포트',
}

export function titleFor(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  // Fallback: /sites/<id>/... → "사이트"
  if (pathname.startsWith('/sites/')) return '사이트'
  if (pathname.startsWith('/reports/')) return '리포트'
  if (pathname.startsWith('/queue/')) return '승인 대기열'
  return ''
}

function SidebarItem({
  href,
  label,
  icon,
  badge,
  active,
  onClick,
}: NavItem & { active: boolean; onClick?: () => void }) {
  const Ico = Icons[icon]
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-[9px] px-2.5 py-1.5 rounded-md text-[13.5px] font-[450] cursor-pointer transition whitespace-nowrap w-full ${
        active
          ? 'bg-[color:var(--color-bg-hover)] text-[color:var(--color-text)] font-medium'
          : 'text-[color:var(--color-text-2)] hover:bg-[color:var(--color-bg-hover)]'
      }`}
    >
      <Ico />
      <span className="flex-1 min-w-0 overflow-hidden text-ellipsis">{label}</span>
      {badge === 'live' && (
        <span
          className="ml-auto flex items-center gap-1 text-[11px] px-1.5 py-px rounded-full bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent-ink)]"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)]"
            style={{ animation: 'pulse-dot 1.6s ease-in-out infinite' }}
          />
          live
        </span>
      )}
      {badge === 'new' && (
        <span className="ml-auto text-[11px] px-1.5 py-px rounded-full bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent-ink)] tabular-nums">
          new
        </span>
      )}
      {badge && badge !== 'live' && badge !== 'new' && (
        <span className="ml-auto text-[11px] px-1.5 py-px rounded-full bg-[color:var(--color-bg-elev)] border border-[color:var(--color-line)] text-[color:var(--color-text-3)] tabular-nums">
          {badge}
        </span>
      )}
    </Link>
  )
}

function Sidebar({
  pathname,
  open,
  onClose,
  workspaces,
  activeWorkspaceId,
}: {
  pathname: string
  open: boolean
  onClose: () => void
  workspaces: Workspace[]
  activeWorkspaceId: string | null
}) {
  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {open && (
        <button
          aria-label="close sidebar"
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}
      <aside
        className={`bg-[color:var(--color-bg-subtle)] border-r border-[color:var(--color-line)] py-4 px-2 flex flex-col gap-3.5 overflow-y-auto
          md:sticky md:top-0 md:h-screen md:translate-x-0
          fixed top-0 left-0 z-50 h-screen w-[260px] transition-transform
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 pt-1 pb-2">
          <div className="w-7 h-7 rounded-md bg-[color:var(--color-text)] text-white flex items-center justify-center font-semibold text-[13px] tracking-wide">
            A
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[13.5px] tracking-tight whitespace-nowrap">
              ASTY Blog Agent
            </div>
            <div className="text-[11px] text-[color:var(--color-text-3)] tabular-nums mt-px">
              Lean · Haiku 4.5
            </div>
          </div>
        </div>

        {/* Workspace switcher */}
        <div className="px-1">
          <div className="text-[11px] text-[color:var(--color-text-3)] uppercase tracking-wider px-1.5 pb-1 font-medium">
            워크스페이스
          </div>
          <WorkspaceSwitcher workspaces={workspaces} activeId={activeWorkspaceId} />
        </div>

        {NAV.map((g) => (
          <div key={g.group} className="flex flex-col gap-px">
            <div className="text-[11px] text-[color:var(--color-text-3)] uppercase tracking-wider px-2.5 pt-2 pb-1 font-medium">
              {g.group}
            </div>
            {g.items.map((it) => (
              <SidebarItem
                key={it.href}
                {...it}
                active={isActive(it.href)}
                onClick={onClose}
              />
            ))}
          </div>
        ))}

        <div className="mt-auto pt-2 border-t border-[color:var(--color-line)] flex gap-2 items-center px-2">
          <div
            className="w-[26px] h-[26px] rounded-full text-white text-[11px] font-semibold flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2f6f4e, #b66f1c)' }}
          >
            JC
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">jooyongc</div>
            <div className="text-[11px] text-[color:var(--color-text-3)]">ASTY workspace</div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              className="p-1.5 rounded-md hover:bg-[color:var(--color-bg-hover)] text-[color:var(--color-text-3)]"
              title="Logout"
            >
              <Icons.External size={14} />
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

function Topbar({
  pathname,
  onOpenSidebar,
}: {
  pathname: string
  onOpenSidebar: () => void
}) {
  return (
    <div
      className="h-14 border-b border-[color:var(--color-line)] flex items-center gap-3.5 px-6 sticky top-0 z-10"
      style={{ background: 'rgba(250,250,248,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <button
        aria-label="open sidebar"
        className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[color:var(--color-bg-hover)]"
        onClick={onOpenSidebar}
      >
        <Icons.Menu />
      </button>
      <div className="flex items-center gap-1.5 text-[13px] text-[color:var(--color-text-3)] min-w-0">
        <span className="text-[color:var(--color-text-3)] hidden sm:inline">ASTY Cabin</span>
        <span className="hidden sm:inline">
          <Icons.Chevron size={12} />
        </span>
        <span className="text-[color:var(--color-text)] truncate">{titleFor(pathname)}</span>
      </div>
    </div>
  )
}

/* ---- public shell component (client) ---- */

export function AppShell({
  children,
  workspaces,
  activeWorkspaceId,
}: {
  children: React.ReactNode
  workspaces: Workspace[]
  activeWorkspaceId: string | null
}) {
  const pathname = usePathname() || '/'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen grid md:grid-cols-[248px_1fr] grid-cols-1">
      <Sidebar
        pathname={pathname}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
      />
      <div className="min-w-0 flex flex-col">
        <Topbar pathname={pathname} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 px-6 md:px-8 py-7 pb-20 max-w-[1440px] w-full">{children}</main>
      </div>
    </div>
  )
}
