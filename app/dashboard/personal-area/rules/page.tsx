'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, ShieldCheck, Loader2, Trash2, Edit2, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Rule {
  id: string
  title: string
  rule: string
  is_active: boolean
  sort_order: number
  color?: string
  font_size?: string
  font_family?: string
}

const COLORS = [
  { label: 'Default', value: '#3b82f6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Teal', value: '#14b8a6' },
]

const FONT_SIZES = [
  { label: 'S', value: 'text-sm' },
  { label: 'M', value: 'text-base' },
  { label: 'L', value: 'text-lg' },
  { label: 'XL', value: 'text-xl' },
]

const FONT_FAMILIES = [
  { label: 'Sans', value: 'font-sans' },
  { label: 'Serif', value: 'font-serif' },
  { label: 'Mono', value: 'font-mono' },
]

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    rule: '',
    color: '#3b82f6',
    font_size: 'text-base',
    font_family: 'font-sans',
  })

  useEffect(() => { fetchRules() }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/rules')
      if (res.ok) setRules(await res.json())
    } catch {
      toast.error('Failed to fetch rules')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.rule) { toast.error('Please fill in all fields'); return }
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/rules/${editingId}` : '/api/rules'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, is_active: true }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      if (editingId) {
        setRules(rules.map(r => r.id === editingId ? saved : r))
        toast.success('Rule updated')
      } else {
        setRules([...rules, saved])
        toast.success('Rule created')
      }
      closeModal()
    } catch {
      toast.error('Failed to save rule')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return
    try {
      await fetch(`/api/rules/${id}`, { method: 'DELETE' })
      setRules(rules.filter(r => r.id !== id))
      toast.success('Rule deleted')
    } catch {
      toast.error('Failed to delete rule')
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setRules(rules.map(r => r.id === id ? updated : r))
    } catch {
      toast.error('Failed to update rule')
    }
  }

  const handleEdit = (rule: Rule) => {
    setForm({
      title: rule.title,
      rule: rule.rule,
      color: rule.color || '#3b82f6',
      font_size: rule.font_size || 'text-base',
      font_family: rule.font_family || 'font-sans',
    })
    setEditingId(rule.id)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm({ title: '', rule: '', color: '#3b82f6', font_size: 'text-base', font_family: 'font-sans' })
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
          <h1 className="text-2xl font-bold text-foreground">Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">Define your trading rules and guidelines</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </div>

      {/* Rules Table */}
      {rules.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No rules yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Add trading rules to keep yourself accountable</p>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Rule Type</span>
            <span>Description</span>
            <span className="text-right pr-2">Actions</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={cn(
                  'grid grid-cols-[1fr_2fr_auto] gap-4 px-4 py-3.5 items-center group transition-colors hover:bg-muted/30',
                  !rule.is_active && 'opacity-50'
                )}
              >
                {/* Left accent + type */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: rule.color || '#3b82f6' }}
                  />
                  <span
                    className={cn(
                      'font-semibold text-foreground truncate',
                      rule.font_size || 'text-sm',
                      rule.font_family || 'font-sans'
                    )}
                    style={{ color: rule.color || undefined }}
                  >
                    {rule.title}
                  </span>
                </div>

                {/* Description */}
                <p
                  className={cn(
                    'text-muted-foreground line-clamp-2',
                    rule.font_size || 'text-sm',
                    rule.font_family || 'font-sans'
                  )}
                >
                  {rule.rule}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleToggle(rule.id, rule.is_active)}
                    title={rule.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {rule.is_active
                      ? <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit Rule' : 'New Rule'}</h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Rule Type</label>
                <Input
                  placeholder="e.g., Risk Management"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  placeholder="e.g., Never risk more than 1% per trade"
                  value={form.rule}
                  onChange={e => setForm({ ...form, rule: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Styling */}
              <div className="space-y-3 pt-1 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Styling</p>

                {/* Color swatches */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button
                        type="button"
                        key={c.value}
                        title={c.label}
                        onClick={() => setForm({ ...form, color: c.value })}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-all',
                          form.color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-6">
                  {/* Font size */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Size</label>
                    <div className="flex gap-1">
                      {FONT_SIZES.map(s => (
                        <button
                          type="button"
                          key={s.value}
                          onClick={() => setForm({ ...form, font_size: s.value })}
                          className={cn(
                            'px-2.5 py-1 rounded text-xs border transition-all',
                            form.font_size === s.value
                              ? 'border-primary bg-primary/10 text-foreground font-medium'
                              : 'border-border text-muted-foreground hover:border-foreground/30'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font family */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Font</label>
                    <div className="flex gap-1">
                      {FONT_FAMILIES.map(f => (
                        <button
                          type="button"
                          key={f.value}
                          onClick={() => setForm({ ...form, font_family: f.value })}
                          className={cn(
                            'px-2.5 py-1 rounded text-xs border transition-all',
                            f.value,
                            form.font_family === f.value
                              ? 'border-primary bg-primary/10 text-foreground font-medium'
                              : 'border-border text-muted-foreground hover:border-foreground/30'
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Preview</p>
                  <p
                    className={cn(form.font_size, form.font_family)}
                    style={{ color: form.color }}
                  >
                    {form.rule || 'Your rule will appear here'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Create Rule'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
