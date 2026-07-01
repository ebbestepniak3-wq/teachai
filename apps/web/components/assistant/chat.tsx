'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Plus, Trash2, Edit3, Download, Search, Star, MessageSquare,
  Loader2, Copy, Check, ChevronDown, Sparkles, BookOpen, FileText,
  ClipboardList, Mail, Award, GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn, formatDate } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  updatedAt: string
  createdAt: string
}

interface AssistantChatProps {
  userId: string
  userName: string
  bundesland?: string | null
  schulform?: string | null
  faecher?: string[]
  initialConversations: Conversation[]
}

const SUGGESTIONS = [
  { icon: FileText, label: 'Klassenarbeit erstellen', prompt: 'Erstelle eine Klassenarbeit für' },
  { icon: BookOpen, label: 'Arbeitsblatt entwerfen', prompt: 'Erstelle ein Arbeitsblatt zum Thema' },
  { icon: ClipboardList, label: 'Bewertungsraster', prompt: 'Erstelle ein Bewertungsraster für' },
  { icon: Mail, label: 'Elternbrief', prompt: 'Schreibe einen Elternbrief zum Thema' },
  { icon: Award, label: 'Zeugnisformulierung', prompt: 'Formuliere eine Zeugnisbemerkung für' },
  { icon: GraduationCap, label: 'Unterrichtsplanung', prompt: 'Plane eine 45-minütige Unterrichtsstunde zum Thema' },
]

function MarkdownText({ text }: { text: string }) {
  // Simple markdown rendering
  const rendered = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-5 mb-2">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br>')

  return (
    <div
      className="prose-sm max-w-none text-sm leading-relaxed [&_li]:my-0.5 [&_p]:mb-2 [&_h2]:text-base [&_h3]:text-sm"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${rendered}</p>` }}
    />
  )
}

export function AssistantChat({
  userName, bundesland, schulform, faecher, initialConversations,
}: AssistantChatProps) {
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/assistant/conversations?id=${id}`)
      if (!res.ok) return
      const data = await res.json()
      const conv = data.data
      const msgs = (conv.messages as Array<{ role: string; content: string }>).map((m, i) => ({
        id: `${id}-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(),
      }))
      setMessages(msgs)
      setCurrentConvId(id)
    } catch {}
  }, [])

  async function sendMessage(messageText?: string) {
    const text = (messageText || input).trim()
    if (!text || streaming) return

    setInput('')
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setStreaming(true)

    // Placeholder for streaming response
    const assistantMsgId = `assistant-${Date.now()}`
    setMessages((prev) => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }])

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: currentConvId,
          context: { bundesland, schulform, fach: faecher?.[0] },
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler beim Senden')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let newConvId = currentConvId

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullText += parsed.text
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantMsgId ? { ...m, content: fullText } : m)
                )
              }
              if (parsed.done && parsed.conversationId) {
                newConvId = parsed.conversationId
                setCurrentConvId(parsed.conversationId)
              }
            } catch {}
          }
        }
      }

      // Refresh conversations
      const convRes = await fetch('/api/assistant/conversations')
      if (convRes.ok) {
        const convData = await convRes.json()
        setConversations(convData.data.conversations)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMsgId
          ? { ...m, content: '❌ Fehler: ' + (error.message || 'Verbindungsfehler') }
          : m
      ))
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
    } finally {
      setStreaming(false)
    }
  }

  async function deleteConversation(id: string) {
    await fetch('/api/assistant/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (currentConvId === id) {
      setCurrentConvId(null)
      setMessages([])
    }
  }

  async function renameConversation(id: string, title: string) {
    await fetch('/api/assistant/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title }),
    })
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title } : c))
    setEditingId(null)
  }

  async function copyMessage(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function exportChat(format: 'markdown' | 'pdf') {
    if (!currentConvId) return
    const res = await fetch(`/api/assistant/export?id=${currentConvId}&format=${format}`)
    if (!res.ok) {
      toast({ title: 'Export fehlgeschlagen', variant: 'destructive' })
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat.${format === 'pdf' ? 'pdf' : 'md'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isNewChat = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-card">
      {/* ── Left sidebar ────────────────────────── */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-border lg:flex">
        {/* New chat button */}
        <div className="p-3 border-b border-border">
          <Button
            variant="gradient"
            size="sm"
            className="w-full"
            onClick={() => { setCurrentConvId(null); setMessages([]) }}
          >
            <Plus className="h-4 w-4" />
            Neues Gespräch
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Gespräche suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted-foreground text-center">
              {searchQuery ? 'Keine Ergebnisse' : 'Noch keine Gespräche'}
            </p>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group relative flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors',
                  currentConvId === conv.id
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                onClick={() => loadConversation(conv.id)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />

                {editingId === conv.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => renameConversation(conv.id, editTitle || conv.title)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameConversation(conv.id, editTitle || conv.title)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 truncate text-xs bg-transparent outline-none border-b border-primary"
                  />
                ) : (
                  <span className="flex-1 truncate text-xs">{conv.title}</span>
                )}

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingId(conv.id)
                      setEditTitle(conv.title)
                    }}
                    className="rounded p-0.5 hover:bg-accent"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                    className="rounded p-0.5 hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Export */}
        {currentConvId && (
          <div className="border-t border-border p-2 flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => exportChat('markdown')}>
              <Download className="h-3.5 w-3.5" />
              MD
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => exportChat('pdf')}>
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        )}
      </div>

      {/* ── Main chat area ──────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">TeacherAI Assistent</p>
              <p className="text-xs text-muted-foreground">
                {currentConvId
                  ? conversations.find((c) => c.id === currentConvId)?.title || 'Gespräch'
                  : 'Neues Gespräch'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="brand" className="text-[10px]">Claude Sonnet 4.6</Badge>
            {streaming && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generiert…
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isNewChat ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 mb-5">
                <Sparkles className="h-8 w-8 text-brand-400" />
              </div>
              <h2 className="text-xl font-bold">
                Hallo{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Ich helfe Ihnen bei Unterrichtsplanung, Arbeitsblättern, Elternbriefen und allem rund um Ihren Schulalltag.
              </p>

              <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-w-2xl w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt + (faecher?.[0] ? ` ${faecher[0]}` : ' …'))}
                    className="group flex items-center gap-2.5 rounded-xl border border-border bg-background/50 px-4 py-3 text-left text-sm transition-all hover:border-brand-500/30 hover:bg-brand-500/5"
                  >
                    <s.icon className="h-4 w-4 shrink-0 text-brand-400" />
                    <span className="font-medium text-xs">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-brand-600 text-white'
                  )}>
                    {msg.role === 'user' ? 'Du' : 'AI'}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    'group relative max-w-[75%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-tr-sm'
                      : 'bg-muted/50 border border-border rounded-tl-sm'
                  )}>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      msg.content ? (
                        <MarkdownText text={msg.content} />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )
                    )}

                    {/* Copy button */}
                    {msg.content && (
                      <button
                        onClick={() => copyMessage(msg.content, msg.id)}
                        className={cn(
                          'absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg',
                          msg.role === 'user' ? '-left-8 -right-auto' : ''
                        )}
                      >
                        {copiedId === msg.id
                          ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                          : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 px-4 py-3 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Stellen Sie eine Frage oder geben Sie eine Aufgabe... (Enter zum Senden)"
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 max-h-32"
              style={{ minHeight: '1.5rem' }}
            />
            {streaming ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 mb-0.5"
                onClick={() => abortRef.current?.abort()}
              >
                Stopp
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="sm"
                className="shrink-0 mb-0.5"
                onClick={() => sendMessage()}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            TeacherAI kann Fehler machen. Prüfen Sie wichtige Inhalte. · Shift+Enter für Zeilenumbruch
          </p>
        </div>
      </div>
    </div>
  )
}
