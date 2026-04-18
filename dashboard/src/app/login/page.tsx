export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form action="/api/auth/login" method="POST" className="bg-white border rounded-lg p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-lg font-semibold mb-1">Blog Agent Dashboard</h1>
        <p className="text-xs text-gray-500 mb-6">Private control panel. Enter password to continue.</p>
        <label className="block text-xs font-medium mb-1">Password</label>
        <input
          name="password"
          type="password"
          required
          autoFocus
          className="w-full border rounded px-3 py-2 text-sm mb-4"
        />
        <SearchParamError params={searchParams} />
        <button
          type="submit"
          className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-700 transition"
        >
          Continue
        </button>
      </form>
    </div>
  )
}

async function SearchParamError({ params }: { params: Promise<{ error?: string }> }) {
  const { error } = await params
  if (!error) return null
  return <p className="text-xs text-red-600 mb-3">Incorrect password.</p>
}
