'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

interface Rule {
  id: string
  title: string
  description: string
  rule?: string
  is_active?: boolean
}

interface PlaybookData {
  name: string
  color: string
  label: string
  entryCriteria: Rule[]
  exitCriteria: Rule[]
  linkedRuleIds: string[]
}

const colors = ['#FF6B35', '#004E89', '#F7931E', '#06A77D', '#D62828', '#F77F00']

export function CreatePlaybookForm({ onSubmit, onCancel }: { onSubmit: (data: PlaybookData) => void | Promise<void>; onCancel: () => void }) {
  const [data, setData] = useState<PlaybookData>({
    name: '',
    color: colors[0],
    label: '',
    entryCriteria: [{ id: '1', title: '', description: '' }],
    exitCriteria: [{ id: '1', title: '', description: '' }],
    linkedRuleIds: [],
  })
  const [userRules, setUserRules] = useState<Rule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rules')
      .then((response) => response.ok ? response.json() : [])
      .then((rules: Rule[]) => setUserRules(rules.filter((rule) => rule.is_active)))
      .catch(() => setUserRules([]))
      .finally(() => setRulesLoading(false))
  }, [])

  const addRule = (type: 'entry' | 'exit') => {
    const newId = Date.now().toString()
    setData(prev => ({
      ...prev,
      [type === 'entry' ? 'entryCriteria' : 'exitCriteria']: [
        ...(type === 'entry' ? prev.entryCriteria : prev.exitCriteria),
        { id: newId, title: '', description: '' }
      ]
    }))
  }

  const updateRule = (type: 'entry' | 'exit', id: string, field: string, value: string) => {
    const key = type === 'entry' ? 'entryCriteria' : 'exitCriteria'
    setData(prev => ({
      ...prev,
      [key]: (prev[key as 'entryCriteria' | 'exitCriteria'] as Rule[]).map((rule: Rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    }))
  }

  const removeRule = (type: 'entry' | 'exit', id: string) => {
    const key = type === 'entry' ? 'entryCriteria' : 'exitCriteria'
    setData(prev => ({
      ...prev,
      [key]: (prev[key as 'entryCriteria' | 'exitCriteria'] as Rule[]).filter((rule: Rule) => rule.id !== id)
    }))
  }

  const handleSubmit = () => {
    if (!data.name.trim()) {
      alert('Please enter a playbook name')
      return
    }
    onSubmit(data)
  }

  return (
    <Card className="p-6 md:p-8 bg-card border border-border/50 max-w-2xl w-full">
      <h2 className="text-2xl font-bold text-foreground mb-6">Create Playbook</h2>

      {/* General Information */}
      <div className="space-y-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">General Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Playbook Name</label>
              <Input
                placeholder="e.g., Absorption Reversal"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="bg-input border border-border/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">Icon or Color</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setData({ ...data, color })}
                    className={`w-8 h-8 rounded transition-transform ${
                      data.color === color ? 'ring-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">Label</label>
              <Input
                placeholder="Brief description of the playbook strategy"
                value={data.label}
                onChange={(e) => setData({ ...data, label: e.target.value })}
                className="bg-input border border-border/50"
              />
            </div>
          </div>

          <div className="border-t border-border/50 pt-5">
            <h3 className="text-lg font-semibold text-foreground mb-2">Rules</h3>
            <p className="text-sm text-muted-foreground mb-4">Select the existing rules that this playbook follows.</p>
            <div className="flex flex-col divide-y divide-border/50 rounded-lg border border-border/50">
              {rulesLoading ? <p className="p-3 text-sm text-muted-foreground">Loading rules…</p> : userRules.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No active rules found.</p> : userRules.map((rule) => <label key={rule.id} className="flex cursor-pointer items-start gap-3 p-3"><input type="checkbox" checked={data.linkedRuleIds.includes(rule.id)} onChange={(event) => setData((current) => ({ ...current, linkedRuleIds: event.target.checked ? [...current.linkedRuleIds, rule.id] : current.linkedRuleIds.filter((id) => id !== rule.id) }))} className="mt-0.5 size-4 shrink-0 accent-primary" /><span><span className="block text-sm font-medium text-foreground">{rule.title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{rule.description || rule.rule || 'No description provided.'}</span></span></label>)}
            </div>
          </div>
        </div>

        {/* Trading Playbook Rules */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Trading Playbook Rules</h3>
          <p className="text-sm text-muted-foreground mb-6">List your rules, track and optimize your playbook performance by grouping. How to build it?</p>

          {/* Entry Criteria */}
          <div className="space-y-4 mb-8">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <span className="text-lg">⋮⋮</span> Entry Criteria
            </h4>
            
            <div className="space-y-3 ml-4">
              {data.entryCriteria.map((rule, idx) => (
                <div key={rule.id} className="space-y-2 p-3 bg-muted rounded-lg">
                  <Input
                    placeholder={`Rule ${idx + 1}`}
                    value={rule.title}
                    onChange={(e) => updateRule('entry', rule.id, 'title', e.target.value)}
                    className="bg-card border border-border/50 text-sm"
                  />
                  <Input
                    placeholder="Description"
                    value={rule.description}
                    onChange={(e) => updateRule('entry', rule.id, 'description', e.target.value)}
                    className="bg-card border border-border/50 text-sm"
                  />
                  {data.entryCriteria.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule('entry', rule.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => addRule('entry')}
              className="text-primary hover:text-primary ml-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Rule
            </Button>
          </div>

          {/* Exit Criteria */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <span className="text-lg">⋮⋮</span> Exit Criteria
            </h4>
            
            <div className="space-y-3 ml-4">
              {data.exitCriteria.map((rule, idx) => (
                <div key={rule.id} className="space-y-2 p-3 bg-muted rounded-lg">
                  <Input
                    placeholder={`Rule ${idx + 1}`}
                    value={rule.title}
                    onChange={(e) => updateRule('exit', rule.id, 'title', e.target.value)}
                    className="bg-card border border-border/50 text-sm"
                  />
                  <Input
                    placeholder="Description"
                    value={rule.description}
                    onChange={(e) => updateRule('exit', rule.id, 'description', e.target.value)}
                    className="bg-card border border-border/50 text-sm"
                  />
                  {data.exitCriteria.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule('exit', rule.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => addRule('exit')}
              className="text-primary hover:text-primary ml-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Rule
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-border/50">
        <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90">
          Create Playbook
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </Card>
  )
}
