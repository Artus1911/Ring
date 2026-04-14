'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/onboarding')
    }
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-sm space-y-8 px-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Check your email</h1>
            <p className="text-zinc-500 text-base">We sent a 6-digit code to<br /><span className="text-zinc-800 font-medium">{email}</span></p>
          </div>
          <form onSubmit={handleOtpSubmit} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              required
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-2xl outline-none focus:border-zinc-900 transition-colors text-center tracking-widest text-zinc-900"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full rounded-xl bg-black text-white py-3 text-base font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError('') }}
              className="w-full text-zinc-400 text-sm py-1 hover:text-zinc-600 transition-colors"
            >
              ← Use a different email
            </button>
          </form>
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
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base outline-none focus:border-zinc-900 transition-colors text-zinc-900"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-3 text-base font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </form>
        <p className="text-zinc-400 text-sm text-center">No password needed.</p>
      </div>
    </div>
  )
}
