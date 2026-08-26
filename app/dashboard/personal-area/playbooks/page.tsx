'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Loader2, Trash2, Edit2, X, ChevronDown, ChevronUp, Zap, ZapOff, Settings, Globe, Lock } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PlaybookEmptyState } from '@/components/playbooks/empty-state'

interface UserRule {
  id: string
  title: string
  rule?: string
  description?: string
  is_active?: boolean
}

interface Playbook {
  id: string
  title: string
  description: string | { id?: string; title?: string; description?: string }
  strategy_type: string
  rules: { entry?: string[]; exit?: string[]; linkedRuleIds?: string[]; custom?: string[] }
  tags: (string | { id?: string; title?: string; description?: string })[]
  is_public: boolean
  is_active: boolean
  public_slug?: string | null
  likes_count?: number
  comments_count?: number
  shares_count?: number
  trades_taken?: number
  winning_trades?: number
  win_rate?: number
  pnl?: number
  public_display_name?: string | null
  public_avatar_url?: string | null
  youtube_links?: string[]
  created_at: string
  updated_at: string
}

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    strategy_type: '',
    is_public: false,
    public_display_name: '',
    public_avatar_url: '',
    youtube_links: '',
    linkedRuleIds: [] as string[],
    customRules: [''],
  })

  useEffect(() => {
    fetchPlaybooks()
  }, [])

  const fetchPlaybooks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/playbooks')
      if (res.ok) {
        const data = await res.json()
        setPlaybooks(data)
        setActiveId(data.find((p: Playbook) => p.is_active)?.id ?? null)
      }
    } catch {
      toast.error('Failed to fetch playbooks')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    const payload = new FormData()
    payload.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: payload })
    if (!res.ok) return toast.error('Could not upload profile photo')
    const { url } = await res.json()
    setForm(current => ({ ...current, public_avatar_url: url }))
    toast.success('Profile photo uploaded')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description) { toast.error('Please fill in all fields'); return }
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/playbooks/${editingId}` : '/api/playbooks'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          youtube_links: form.youtube_links.split('\n').map(link => link.trim()).filter(Boolean),
          rules: { linkedRuleIds: form.linkedRuleIds, custom: form.customRules.map(rule => rule.trim()).filter(Boolean) },
        }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      if (editingId) {
        setPlaybooks(playbooks.map(p => p.id === editingId ? saved : p))
        toast.success('Playbook updated')
      } else {
        setPlaybooks([...playbooks, saved])
        toast.success('Playbook created')
      }
      closeModal()
    } catch {
      toast.error('Failed to save playbook')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this playbook?')) return
    try {
      await fetch(`/api/playbooks/${id}`, { method: 'DELETE' })
      setPlaybooks(playbooks.filter(p => p.id !== id))
      if (activeId === id) setActiveId(null)
      toast.success('Playbook deleted')
    } catch {
      toast.error('Failed to delete playbook')
    }
  }

  const handleEdit = (p: Playbook) => {
    setForm({ title: p.title, description: getDisplayText(p.description), strategy_type: p.strategy_type || '', is_public: p.is_public, public_display_name: p.public_display_name || '', public_avatar_url: p.public_avatar_url || '', youtube_links: (p.youtube_links || []).join('\n'), linkedRuleIds: p.rules?.linkedRuleIds || [], customRules: p.rules?.custom?.length ? p.rules.custom : [''] })
    setEditingId(p.id)
    setShowModal(true)
  }

  const handleActivate = async (id: string) => {
    const currentlyActive = activeId === id
    const res = await fetch(`/api/playbooks/${id}/engagement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: currentlyActive ? 'deactivate' : 'activate' }) })
    if (!res.ok) return toast.error('Failed to activate playbook')
    const updated = await res.json()
    setPlaybooks(playbooks.map(p => ({ ...p, is_active: !currentlyActive && p.id === updated.id })))
    setActiveId(currentlyActive ? null : updated.id)
    toast.success(currentlyActive ? 'Playbook deactivated' : 'Playbook activated — new trades will use this playbook')
  }

  const handlePublish = async (p: Playbook) => {
    const res = await fetch(`/api/playbooks/${p.id}/engagement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', value: !p.is_public }) })
    if (!res.ok) return toast.error('Failed to update visibility')
    const updated = await res.json()
    setPlaybooks(playbooks.map(item => item.id === p.id ? updated : item))
    toast.success(updated.is_public ? 'Playbook published to Templates' : 'Playbook made private')
  }

  const getDisplayText = (value: unknown): string => {
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    if (value && typeof value === 'object') {
      const item = value as { title?: unknown; description?: unknown; id?: unknown }
      if (typeof item.description === 'string') return item.description
      if (typeof item.title === 'string') return item.title
      if (typeof item.id === 'string') return item.id
    }
    return ''
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm({ title: '', description: '', strategy_type: '', is_public: false, public_display_name: '', public_avatar_url: '', youtube_links: '', linkedRuleIds: [], customRules: [''] })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Playbooks</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your trading strategies</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          New Playbook
        </Button>
      </div>

      {/* Active notice */}
      {activeId && (() => {
        const active = playbooks.find(p => p.id === activeId)
        return active ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground font-medium">Active playbook:</span>
            <span className="text-primary">{active.title}</span>
            <span className="text-muted-foreground ml-1">— all new trades will be tagged to this playbook</span>
          </div>
        ) : null
      })()}

      {/* Playbooks list */}
      {playbooks.length === 0 ? (
        <PlaybookEmptyState onCreateClick={() => setShowModal(true)} />
      ) : (
        <div className="space-y-3">
          {playbooks.map(p => {
            const isExpanded = expandedId === p.id
            const isActive = activeId === p.id
            return (
              <Card
                key={p.id}
                className={cn(
                  'overflow-hidden transition-all',
                  isActive && 'border-primary/50 shadow-sm shadow-primary/10'
                )}
              >
                {/* Active stripe */}
                {isActive && <div className="h-0.5 w-full bg-primary" />}

                {/* Main row — click to expand */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{p.title}</h3>
                      {isActive && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-primary/15 text-primary">
                          Active
                        </span>
                      )}
                      {p.strategy_type && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                          {p.strategy_type}
                        </span>
                      )}
                    </div>
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{getDisplayText(p.description)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Settings for ${p.title}`}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleActivate(p.id)}>
                          {isActive ? <ZapOff className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                          {isActive ? 'Deactivate playbook' : 'Activate playbook'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePublish(p)}>
                          {p.is_public ? <Lock className="w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                          {p.is_public ? 'Make private' : 'Publish to Templates'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(p)}><Edit2 className="w-4 h-4 mr-2" />Edit playbook</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 mr-2" />Delete playbook</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded description */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-border/50">
                    <div className="pt-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h4>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{getDisplayText(p.description)}</p>
                      </div>

                      {p.rules?.entry && p.rules.entry.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Entry Rules</h4>
                          <ul className="space-y-1">
                            {p.rules.entry.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="text-primary mt-0.5">•</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {p.rules?.exit && p.rules.exit.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Exit Rules</h4>
                          <ul className="space-y-1">
                            {p.rules.exit.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="text-primary mt-0.5">•</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {p.rules?.linkedRuleIds && p.rules.linkedRuleIds.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Linked Rules</h4>
                          <ul className="space-y-1">{p.rules.linkedRuleIds.map(id => <li key={id} className="text-sm text-foreground">{id}</li>)}</ul>
                        </div>
                      )}

                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.tags.map((t, i) => {
                            const tagText = getDisplayText(t)
                            return (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">{tagText}</span>
                            )
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                        <div><p className="text-xs text-muted-foreground">Trades</p><p className="font-semibold text-foreground">{p.trades_taken ?? 0}</p></div>
                        <div><p className="text-xs text-muted-foreground">Win rate</p><p className="font-semibold text-foreground">{p.win_rate ?? 0}%</p></div>
                        <div><p className="text-xs text-muted-foreground">P&L</p><p className={cn('font-semibold', (p.pnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-destructive')}>${(p.pnl ?? 0).toFixed(2)}</p></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(p.created_at).toLocaleDateString()} &middot; Updated {new Date(p.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Playbook' : 'New Playbook'}</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Playbook Name</label>
                <Input placeholder="e.g., Breakout Strategy" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Strategy Type</label>
                <Input placeholder="e.g., Scalping, Swing, Day Trading" value={form.strategy_type} onChange={e => setForm({ ...form, strategy_type: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  placeholder="Describe your strategy, setup criteria, and approach..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rules</label>
                <p className="text-xs text-muted-foreground">These rules will appear when documenting trades with this playbook.</p>
                <div className="space-y-2">
                  {form.customRules.map((rule, index) => <div key={index} className="flex gap-2"><Input placeholder="e.g., Only trade with the trend" value={rule} onChange={e => setForm(current => ({ ...current, customRules: current.customRules.map((item, i) => i === index ? e.target.value : item) }))} /><Button type="button" variant="ghost" size="sm" onClick={() => setForm(current => ({ ...current, customRules: current.customRules.filter((_, i) => i !== index) }))} disabled={form.customRules.length === 1}>Remove</Button></div>)}
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(current => ({ ...current, customRules: [...current.customRules, ''] }))}>Add rule</Button>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} className="mt-1 h-4 w-4 accent-primary" />
                  <span><span className="block text-sm font-medium text-foreground">Make this playbook public</span><span className="block text-xs text-muted-foreground mt-1">Anyone with the public link can discover and view it in Templates & Playbooks.</span></span>
                </label>
                {form.is_public && <div className="space-y-3">
                  <div className="space-y-1.5"><label className="text-sm font-medium text-foreground">Name shown publicly</label><Input placeholder="Your preferred display name" value={form.public_display_name} onChange={e => setForm({ ...form, public_display_name: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium text-foreground">Profile photo</label><Input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file) void handleAvatarUpload(file) }} /><Input type="url" placeholder="Or paste a public image URL" value={form.public_avatar_url} onChange={e => setForm({ ...form, public_avatar_url: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium text-foreground">YouTube videos</label><textarea rows={3} placeholder="One YouTube URL per line" value={form.youtube_links} onChange={e => setForm({ ...form, youtube_links: e.target.value })} className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" /><p className="text-xs text-muted-foreground">Add videos that explain this playbook.</p></div>
                </div>}
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Create Playbook'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
