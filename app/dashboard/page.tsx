'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Task = {
  id: string
  text: string
  due_at: string | null
  status: string
}

type CallLog = {
  id: string
  called_at: string
  outcome: string | null
  tasks: { text: string }[] | null
}

function formatDue(due_at: string) {
  const date = new Date(due_at)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (isToday) return `Today at ${time}`
  if (isTomorrow) return `Tomorrow at ${time}`
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${time}`
}

export default function Dashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [timezone, setTimezone] = useState('America/New_York')
  const [taskInput, setTaskInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [error, setError] = useState('')

  const fetchData = useCallback(async (uid: string) => {
    const [{ data: taskData }, { data: logData }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', uid)
        .eq('status', 'pending')
        .order('due_at', { ascending: true }),
      supabase
        .from('call_logs')
        .select('id, called_at, outcome, tasks(text)')
        .eq('tasks.user_id', uid)
        .order('called_at', { ascending: false })
        .limit(5),
    ])
    if (taskData) setTasks(taskData)
    if (logData) setCallLogs(logData as CallLog[])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/')
        return
      }
      setUserId(user.id)

      supabase
        .from('users')
        .select('timezone')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.timezone) setTimezone(data.timezone)
        })

      fetchData(user.id)
    })
  }, [router, fetchData])

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskInput.trim() || !userId) return

    setParsing(true)
    setError('')

    try {
      const res = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taskInput, timezone }),
      })

      const parsed = await res.json()
      if (parsed.error) throw new Error(parsed.error)

      const { error: dbError } = await supabase.from('tasks').insert({
        user_id: userId,
        text: parsed.task,
        due_at: parsed.due_at,
        status: 'pending',
      })

      if (dbError) throw new Error(dbError.message)

      setTaskInput('')
      await fetchData(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ring</h1>
          <p className="text-zinc-500 mt-1">Your upcoming tasks</p>
        </div>

        {/* Task input */}
        <form onSubmit={handleAddTask} className="space-y-3">
          <textarea
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            placeholder="e.g. call dentist tomorrow at 2pm"
            rows={2}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-base outline-none focus:border-zinc-900 transition-colors resize-none text-zinc-900"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={parsing || !taskInput.trim()}
            className="w-full rounded-xl bg-black text-white py-3 text-base font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {parsing ? 'Adding…' : 'Add task'}
          </button>
        </form>

        {/* Upcoming tasks */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Upcoming</h2>
          {tasks.length === 0 ? (
            <p className="text-zinc-400 text-sm">No tasks yet. Add one above.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map(task => (
                <li key={task.id} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-100 px-4 py-3">
                  <span className="text-base text-zinc-900">{task.text}</span>
                  {task.due_at && (
                    <span className="text-sm text-zinc-400 whitespace-nowrap shrink-0">{formatDue(task.due_at)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent calls */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Recent calls</h2>
          {callLogs.length === 0 ? (
            <p className="text-zinc-400 text-sm">No calls yet.</p>
          ) : (
            <ul className="space-y-3">
              {callLogs.map(log => (
                <li key={log.id} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-100 px-4 py-3">
                  <span className="text-base text-zinc-900">{log.tasks?.[0]?.text ?? '—'}</span>
                  <span className="text-sm text-zinc-400 whitespace-nowrap shrink-0 capitalize">{log.outcome ?? 'unknown'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}
