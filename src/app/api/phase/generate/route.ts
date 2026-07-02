export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts'
import { verifyPasscode, unauthorizedResponse } from '@/lib/auth'
import type { GeneratePhaseRequest, GeneratePhaseResponse } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  if (!verifyPasscode(req.headers.get('x-access-code'))) return unauthorizedResponse()

  try {
    const body = await req.json() as GeneratePhaseRequest
    const { phaseId, workflowInput, previousPhases, humanFeedback } = body

    if (!phaseId || !workflowInput?.title || !workflowInput?.description) {
      return NextResponse.json({ error: 'Missing required fields: phaseId, workflowInput.title, workflowInput.description' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(phaseId, workflowInput, previousPhases ?? [], humanFeedback) }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let output: GeneratePhaseResponse
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      output = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('JSON parse error. Raw length:', raw.length, 'Stop reason:', message.stop_reason)
      if (message.stop_reason === 'max_tokens') {
        return NextResponse.json({ error: 'The AI response was too long. Try simplifying the description or using a more specific workflow type.' }, { status: 500 })
      }
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
    }

    return NextResponse.json(output)
  } catch (err) {
    console.error('Phase generate error:', err)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
