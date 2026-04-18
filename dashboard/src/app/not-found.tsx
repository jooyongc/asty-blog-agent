import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Not found</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to sites</Link>
      </div>
    </div>
  )
}
