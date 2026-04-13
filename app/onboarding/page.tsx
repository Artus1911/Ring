'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TIMEZONES = [
  { label: 'Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (US & Canada)', value: 'America/Denver' },
  { label: 'Central Time (US & Canada)', value: 'America/Chicago' },
  { label: 'Eastern Time (US & Canada)', value: 'America/New_York' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'Paris / Berlin / Rome (CET)', value: 'Europe/Paris' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Mumbai (IST)', value: 'Asia/Kolkata' },
  { label: 'Singapore / Hong Kong', value: 'Asia/Singapore' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Auckland (NZST)', value: 'Pacific/Auckland' },
]

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Auto-detect timezone
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    const match = TIMEZONES.find(tz => tz.value === detected)
    if (match) setTimezone(match.value)
    else setTimezone(TIMEZONES[3].value) // default Eastern
  }, [])

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    setStep(2)
  }

  async function handleTimezoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      phone: phone.trim(),
      timezone,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-sm px-6 space-y-8">
          <div className="space-y-2">
            <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-2xl font-semibold">What's your phone number?</h1>
            <p className="text-zinc-500 text-base">Ring will call this number when it's time to do your tasks.</p>
          </div>
          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base outline-none focus:border-zinc-900 transition-colors"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-black text-white py-3 text-base font-medium hover:bg-zinc-800 transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6 space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest">Step 2 of 2</p>
          <h1 className="text-2xl font-semibold">What's your timezone?</h1>
          <p className="text-zinc-500 text-base">So Ring calls you at the right time.</p>
        </div>
        <form onSubmit={handleTimezoneSubmit} className="space-y-3">
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base outline-none focus:border-zinc-900 transition-colors bg-white appearance-none"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black text-white py-3 text-base font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : "Let's go"}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-zinc-400 text-sm py-1 hover:text-zinc-600 transition-colors"
          >
            ← Back
          </button>
        </form>
      </div>
    </div>
  )
}
