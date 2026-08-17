'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  PlusIcon,
  SendIcon,
  StopCircleIcon,
  Trash2Icon,
  BotIcon,
  UserIcon,
  CopyIcon,
  CheckIcon,
  RotateCcwIcon,
  ChevronRightIcon,
  SparklesIcon,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface DBMessage {
  id: string
  role: 'user' | 'assistant'
  message: string
  created_at: string
}

// ── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'How do I stop moving my stop loss?',
  'What is the best way to manage revenge trading?',
  'How do I build consistency in my trading?',
  'Help me create a pre-trade checklist.',
  'Why do I overtrade and how do I fix it?',
  'How should I review my losing trades?',
]

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  // Headers
  text = text.replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>')
  text = text.replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-4 mb-1">$1</h2>')
  text = text.replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
  // Bullet lists
  text = text.replace(/^\s*[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  text = text.replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="space-y-0.5 my-1">$1</ul>')
  // Numbered lists
  text = text.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
  // Paragraphs (double newline)
  text = text.replace(/\n{2,}/g, '</p><p class="mb-2">')
  return `<p class="mb-2">${text}</p>`
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  role,
  content,
  isStreaming,
}: {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = role === 'user'

  return (
    <div className={cn('group flex gap-3 py-4', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border text-primary'
        )}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <BotIcon className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0 max-w-[80%]', isUser && 'flex flex-col items-end')}>
        <span className="text-xs text-muted-foreground mb-1 block">
          {isUser ? 'You' : 'JnV AI'}
        </span>

        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border/60 text-card-foreground rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <>
              <div
                className="prose-sm max-w-none [&_.inline-code]:bg-muted [&_.inline-code]:px-1 [&_.inline-code]:py-0.5 [&_.inline-code]:rounded [&_.inline-code]:text-xs [&_.inline-code]:font-mono"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" />
              )}
            </>
          )}
        </div>

        {/* Copy button — AI only */}
        {!isUser && !isStreaming && (
          <button
            onClick={handleCopy}
            className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <><CheckIcon className="w-3 h-3" /> Copied</>
            ) : (
              <><CopyIcon className="w-3 h-3" /> Copy</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 py-12 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <SparklesIcon className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">JnV AI Coach</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Your personal trading coach. Ask anything about psychology, risk, consistency, or journal review.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="text-left px-4 py-3 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm text-card-foreground group"
          >
            <span className="text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
              {prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Session item ──────────────────────────────────────────────────────────────

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: Session
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
      onClick={onSelect}
    >
      <span className="flex-1 truncate">{session.title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive flex-shrink-0"
      >
        <Trash2Icon className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AICoachPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingSession, setLoadingSession] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── useChat ────────────────────────────────────────────────────────────────
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: { sessionId: activeSessionId },
    }),
  })

  const [input, setInput] = useState('')

  const isStreaming = status === 'streaming' || status === 'submitted'

  // ── Load sessions on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchSessions()
  }, [])

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  // ── Fetch sessions ─────────────────────────────────────────────────────────
  const fetchSessions = async () => {
    const res = await fetch('/api/ai/sessions')
    if (res.ok) {
      const data = await res.json()
      setSessions(data)
    }
  }

  // ── Create new session ─────────────────────────────────────────────────────
  const createSession = useCallback(async () => {
    const res = await fetch('/api/ai/sessions', { method: 'POST' })
    if (!res.ok) return
    const session = await res.json()
    setSessions(prev => [session, ...prev])
    setActiveSessionId(session.id)
    setMessages([])
  }, [setMessages])

  // ── Select session ─────────────────────────────────────────────────────────
  const selectSession = useCallback(async (sessionId: string) => {
    if (sessionId === activeSessionId) return
    setLoadingSession(true)
    setActiveSessionId(sessionId)

    const res = await fetch(`/api/ai/sessions/${sessionId}`)
    if (res.ok) {
      const dbMessages: DBMessage[] = await res.json()
      // Convert DB messages to UIMessage format
      const uiMessages = dbMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.message }],
        content: m.message,
      }))
      setMessages(uiMessages)
    }
    setLoadingSession(false)
  }, [activeSessionId, setMessages])

  // ── Delete session ─────────────────────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId: string) => {
    await fetch('/api/ai/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId(null)
      setMessages([])
    }
  }, [activeSessionId, setMessages])

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    // Create session on first message if none active
    let sessionId = activeSessionId
    if (!sessionId) {
      const res = await fetch('/api/ai/sessions', { method: 'POST' })
      if (!res.ok) return
      const session = await res.json()
      setSessions(prev => [session, ...prev])
      setActiveSessionId(session.id)
      sessionId = session.id
    }

    setInput('')
    sendMessage({ text })
  }, [input, isStreaming, activeSessionId, sendMessage])

  // ── Handle suggested prompt ────────────────────────────────────────────────
  const handlePrompt = useCallback(async (prompt: string) => {
    setInput(prompt)
    // Small delay so setInput registers before we trigger send
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }, [setInput])

  // ── Keyboard submit ────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col border-r border-border bg-sidebar transition-all duration-300 overflow-hidden flex-shrink-0',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        <div className="p-3 border-b border-border flex-shrink-0">
          <Button
            onClick={createSession}
            className="w-full gap-2 justify-start"
            variant="outline"
            size="sm"
          >
            <PlusIcon className="w-4 h-4" />
            New conversation
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                No conversations yet
              </p>
            ) : (
              sessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  onSelect={() => selectSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Chat area ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRightIcon className={cn('w-4 h-4 transition-transform', sidebarOpen && 'rotate-180')} />
          </button>
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">JnV AI</span>
            <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">Coach</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-4">
            {loadingSession ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState onPrompt={handlePrompt} />
            ) : (
              <>
                {messages.map((message, i) => {
                  const textContent = message.parts
                    ?.filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('') ?? (message as any).content ?? ''
                  const isLastAssistant =
                    message.role === 'assistant' &&
                    i === messages.length - 1 &&
                    isStreaming

                  return (
                    <MessageBubble
                      key={message.id}
                      role={message.role as 'user' | 'assistant'}
                      content={textContent}
                      isStreaming={isLastAssistant}
                    />
                  )
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border bg-background p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end bg-card border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask JnV AI anything about your trading..."
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[24px] max-h-[160px] placeholder:text-muted-foreground"
                disabled={isStreaming}
              />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isStreaming ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={stop}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <StopCircleIcon className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-8 w-8"
                  >
                    <SendIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              JnV AI can make mistakes. Always apply your own judgment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
