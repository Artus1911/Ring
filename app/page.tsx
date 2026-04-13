'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3 px-6">
          <div className="text-5xl mb-6">📬</div>
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-zinc-500 text-base">We sent a magic link to<br /><span className="text-zinc-800 font-medium">{email}</span></p>
          <p className="text-zinc-400 text-sm pt-2">Click the link in the email to sign in.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Ring</h1>
          <p className="text-zinc-500 text-base leading-relaxed">
            AI calls you when it's time to do things.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base outline-none focus:border-zinc-900 transition-colors"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-3 text-base font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
        <p className="text-zinc-400 text-sm text-center">No password needed.</p>
      </div>
    </div>
  )
}
