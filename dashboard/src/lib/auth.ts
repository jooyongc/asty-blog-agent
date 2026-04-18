import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'dash_session'

export async function isAuthed(): Promise<boolean> {
  const secret = process.env.DASHBOARD_SESSION_SECRET ?? ''
  if (!secret) return false
  const session = (await cookies()).get(SESSION_COOKIE)?.value
  return Boolean(session && session === secret)
}

export async function requireAuth(): Promise<void> {
  const { redirect } = await import('next/navigation')
  if (!(await isAuthed())) redirect('/login')
}
