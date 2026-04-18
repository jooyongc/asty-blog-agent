import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Blog Agent Dashboard',
  description: 'Control panel for the multi-site blog automation agent.',
  robots: { index: false, follow: false },
}

async function isAuthed(): Promise<boolean> {
  const secret = process.env.DASHBOARD_SESSION_SECRET ?? 'dev'
  const session = (await cookies()).get('dash_session')?.value
  return Boolean(session && session === secret)
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthed()
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {authed ? (
          <header className="border-b bg-white sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-semibold tracking-tight">Blog Agent</Link>
                <nav className="flex gap-5 text-sm text-gray-600">
                  <Link href="/" className="hover:text-gray-900">Sites</Link>
                  <Link href="/pipeline" className="hover:text-gray-900">Pipeline</Link>
                  <Link href="/reports" className="hover:text-gray-900">Reports</Link>
                </nav>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button className="text-xs text-gray-500 hover:text-gray-900">Logout</button>
              </form>
            </div>
          </header>
        ) : null}
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-gray-50 py-4 px-6 text-xs text-gray-500">
          asty-blog-agent-dashboard — private control panel
        </footer>
      </body>
    </html>
  )
}
