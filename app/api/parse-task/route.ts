import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const { text, timezone } = await request.json()

  const now = new Date().toLocaleString('en-US', {
    timeZone: timezone || 'UTC',
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a task parser. Extract the task name and due date/time from this input.

Current date and time: ${now} (timezone: ${timezone || 'UTC'})

Task input: "${text}"

Return ONLY valid JSON with this exact structure:
{
  "task": "concise task name",
  "due_at": "ISO 8601 datetime string, or null if no time mentioned"
}

Examples:
- "call dentist tomorrow at 2pm" → {"task": "Call dentist", "due_at": "2025-04-15T14:00:00"}
- "finish report" → {"task": "Finish report", "due_at": null}
- "gym monday morning 8am" → {"task": "Gym", "due_at": "2025-04-21T08:00:00"}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Failed to parse task' }, { status: 500 })
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
  }
}
