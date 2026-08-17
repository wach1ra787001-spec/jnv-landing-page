import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  UIMessage,
} from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are JnV AI.

You are the AI trading coach inside the JnV Pro Trading Journal.

Your purpose is to help traders improve their performance, discipline, psychology, risk management, execution, consistency, and journaling quality.

Never pretend to know a user's trading data unless it has been explicitly provided to you in this conversation.

If the user asks about their trades, performance, or statistics and no trade information has been provided, tell them to import or journal their trades first so you can help them better.

Always explain your reasoning clearly and concisely.

Avoid making financial predictions or telling users which specific trades to take.

Instead, coach them to become better, more disciplined traders through reflection, frameworks, and mindset work.

Keep answers practical and actionable.

When discussing psychology, encourage reflection rather than certainty.

You represent the JnV platform. Be professional, supportive, and direct.

Never say you are ChatGPT. Never mention OpenAI unless directly asked about the underlying technology.`

export async function POST(req: Request) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { messages, sessionId }: { messages: UIMessage[]; sessionId?: string } = await req.json()

  // Save user message to DB
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user' && sessionId) {
    const userText = lastMessage.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('') ?? ''

    await supabase.from('ai_chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      message: userText,
    })

    // Update session title from first message if not set yet
    const { data: session } = await supabase
      .from('ai_chat_sessions')
      .select('title')
      .eq('id', sessionId)
      .single()

    if (session && (!session.title || session.title === 'New conversation')) {
      const title = userText.length > 60 ? userText.slice(0, 57) + '...' : userText
      await supabase
        .from('ai_chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
    }
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    instructions: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      // Save assistant response to DB
      if (sessionId) {
        await supabase.from('ai_chat_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          message: text,
        })
        await supabase
          .from('ai_chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId)
      }
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
