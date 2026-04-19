import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter, JetBrains_Mono, Instrument_Serif, Noto_Sans_JP, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/app-shell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})
const notoJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-jp',
  weight: ['400', '500', '600'],
  display: 'swap',
})
const notoSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sc',
  weight: ['400', '500', '600'],
  display: 'swap',
})

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
  const fontVars = `${inter.variable} ${jetBrainsMono.variable} ${instrumentSerif.variable} ${notoJP.variable} ${notoSC.variable}`
  return (
    <html lang="ko" className={`h-full ${fontVars}`}>
      <body className="min-h-full flex flex-col">
        {authed ? (
          <AppShell>{children}</AppShell>
        ) : (
          <main className="flex-1">{children}</main>
        )}
      </body>
    </html>
  )
}
