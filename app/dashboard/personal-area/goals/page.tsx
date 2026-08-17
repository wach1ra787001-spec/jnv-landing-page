'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Target, Loader2, Trash2, Edit2, X, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Goal {
  id: string
  title: string
  goal_type: string
  start_date: string
  end_date: string
  target_value: number
  current_value: number
  status: 'active' | 'completed' | 'cancelled'
}

const GOAL_TYPES = [
  { value: 'Profit target', label: 'Profit Target' },
  { value: 'Consistency', label: 'Consistency' },
  { value: 'Discipline', label: 'Discipline' },
  { value: 'Journalling', label: 'Journalling' },
]

const TYPE_COLORS: Record<string, string> = {
  'Profit target': 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  'Consistency': 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  'Discipline': 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  'Journalling': 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    goal_type: 'Profit target',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    target_value: '',
    current_value: '',
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch {
      toast.error('Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.end_date || !formData.goal_type) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId ? `/api/goals/${editingId}` : '/api/goals'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_value: parseFloat(formData.target_value as string) || 0,
          current_value: parseFloat(formData.current_value as string) || 0,
        }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      if (editingId) {
        setGoals(goals.map(g => (g.id === editingId ? saved : g)))
        toast.success('Goal updated')
      } else {
        setGoals([saved, ...goals])
        toast.success('Goal created')
      }
      closeModal()
    } catch {
      toast.error('Failed to save goal')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      setGoals(goals.filter(g => g.id !== id))
      toast.success('Goal deleted')
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  const handleEdit = (goal: Goal) => {
    setFormData({
      title: goal.title,
      goal_type: goal.goal_type,
      start_date: goal.start_date,
      end_date: goal.end_date,
      target_value: String(goal.target_value),
      current_value: String(goal.current_value),
    })
    setEditingId(goal.id)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      title: '',
      goal_type: 'Profit target',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      target_value: '',
      current_value: '',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Set and track your trading objectives</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No goals yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Create your first trading goal to start tracking progress</p>
          <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const progress = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0
            const isComplete = goal.status === 'completed' || progress >= 100
            const typeColor = TYPE_COLORS[goal.goal_type] || 'bg-muted text-muted-foreground'

            return (
              <Card key={goal.id} className={cn('p-5 group relative', isComplete && 'opacity-75')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      {isComplete
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                      <h3 className="font-semibold text-foreground truncate">{goal.title}</h3>
                    </div>
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', typeColor)}>
                      {goal.goal_type}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(goal)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                {goal.target_value > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{goal.current_value} / {goal.target_value}</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', isComplete ? 'bg-emerald-500' : 'bg-primary')}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <p className="text-xs text-muted-foreground">
                  {new Date(goal.start_date).toLocaleDateString()} &rarr; {new Date(goal.end_date).toLocaleDateString()}
                </p>
              </Card>
            )
          })}
        </div>
      )}

      {/* Floating Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? 'Edit Goal' : 'New Goal'}
              </h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Goal Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Goal Name</label>
                <Input
                  placeholder="e.g., March Profit Target"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Goal Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Type of Goal</label>
                <Select value={formData.goal_type} onValueChange={v => setFormData({ ...formData, goal_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">End Date</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Target */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Target Value</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.target_value}
                    onChange={e => setFormData({ ...formData, target_value: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Current Value</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.current_value}
                    onChange={e => setFormData({ ...formData, current_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update Goal' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
