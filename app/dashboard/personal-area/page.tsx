"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Edit2, FileText, Loader2, X, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreatePlaybookForm } from "@/components/dashboard/create-playbook-form"

interface PlaybookData {
  name: string
  color: string
  label: string
  entryCriteria: Array<{ id: string; title: string; description: string }>
  exitCriteria: Array<{ id: string; title: string; description: string }>
  linkedRuleIds: string[]
}

interface Goal {
  id: string
  title: string
  description?: string
  target_value: number
  current_value: number
  end_date: string
  status: "active" | "completed" | "cancelled"
  metric_type: string
}

interface Rule {
  id: string
  title: string
  description?: string
  priority?: "high" | "medium" | "low"
  category?: string
  is_active: boolean
  tags?: string[]
}

interface Playbook {
  id: string
  title: string
  description?: string
  strategy_type?: string
  color?: string
  rules?: {
    entry: Array<{ id: string; title: string; description: string }>
    exit: Array<{ id: string; title: string; description: string }>
  }
  tags?: string[]
  is_public?: boolean
}

export default function PersonalAreaPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"goals" | "rules" | "playbooks" | "notes">("goals")
  const [goals, setGoals] = useState<Goal[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlaybookChoice, setShowPlaybookChoice] = useState(false)
  const [showCreatePlaybookForm, setShowCreatePlaybookForm] = useState(false)
  const [isCreatingPlaybook, setIsCreatingPlaybook] = useState(false)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        if (activeTab === "goals") {
          const res = await fetch("/api/goals")
          if (res.ok) {
            const data = await res.json()
            setGoals(data)
          }
        } else if (activeTab === "rules") {
          const res = await fetch("/api/rules")
          if (res.ok) {
            const data = await res.json()
            setRules(data)
          }
        } else if (activeTab === "playbooks") {
          const res = await fetch("/api/playbooks")
          if (res.ok) {
            const data = await res.json()
            setPlaybooks(data)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        toast.error("Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab])

  const deleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
      if (res.ok) {
        setGoals(goals.filter(g => g.id !== id))
        toast.success("Goal deleted")
      }
    } catch (error) {
      toast.error("Failed to delete goal")
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" })
      if (res.ok) {
        setRules(rules.filter(r => r.id !== id))
        toast.success("Rule deleted")
      }
    } catch (error) {
      toast.error("Failed to delete rule")
    }
  }

  const deletePlaybook = async (id: string) => {
    try {
      const res = await fetch(`/api/playbooks/${id}`, { method: "DELETE" })
      if (res.ok) {
        setPlaybooks(playbooks.filter(p => p.id !== id))
        toast.success("Playbook deleted")
      }
    } catch (error) {
      toast.error("Failed to delete playbook")
    }
  }

  const toggleRuleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive })
      })
      if (res.ok) {
        setRules(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r))
      }
    } catch (error) {
      toast.error("Failed to update rule")
    }
  }

  const handleCreatePlaybook = async (data: PlaybookData) => {
    try {
      setIsCreatingPlaybook(true)
      const res = await fetch('/api/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.name,
          description: data.label,
          color: data.color,
          rules: {
            entry: data.entryCriteria,
            exit: data.exitCriteria,
            linkedRuleIds: data.linkedRuleIds
          }
        })
      })

      if (res.ok) {
        const newPlaybook = await res.json()
        setPlaybooks([...playbooks, newPlaybook])
        toast.success('Playbook created successfully!')
        setShowCreatePlaybookForm(false)
        setShowPlaybookChoice(false)
      } else {
        toast.error('Failed to create playbook')
      }
    } catch (error) {
      console.error('[v0] Error creating playbook:', error)
      toast.error('Failed to create playbook')
    } finally {
      setIsCreatingPlaybook(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border/50">
        <Button
          variant={activeTab === "goals" ? "default" : "ghost"}
          onClick={() => setActiveTab("goals")}
          className="border-b-2"
        >
          Goals
        </Button>
        <Button
          variant={activeTab === "rules" ? "default" : "ghost"}
          onClick={() => setActiveTab("rules")}
          className="border-b-2"
        >
          Rules
        </Button>
        <Button
          variant={activeTab === "playbooks" ? "default" : "ghost"}
          onClick={() => setActiveTab("playbooks")}
          className="border-b-2"
        >
          Playbooks
        </Button>
        <Button
          variant={activeTab === "notes" ? "default" : "ghost"}
          onClick={() => router.push("/dashboard/personal-area/notes")}
          className="gap-2 border-b-2"
        >
          <FileText className="w-4 h-4" />
          Notes
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Goals Tab */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Goal
              </Button>

              {goals.length === 0 ? (
                <Card className="p-12 bg-card border-border text-center">
                  <p className="text-muted-foreground">No goals yet. Create one to get started!</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map((goal) => (
                    <Card key={goal.id} className="p-6 bg-card border-border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{goal.title}</h3>
                          <p className="text-sm text-muted-foreground">Due {goal.end_date}</p>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          goal.status === "completed"
                            ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                            : goal.status === "active"
                            ? "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                            : "bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300"
                        )}>
                          {goal.status}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground font-medium">{goal.current_value.toFixed(0)} / {goal.target_value.toFixed(0)}</span>
                            <span className="text-muted-foreground">{((goal.current_value / goal.target_value) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button variant="ghost" size="sm" className="flex-1 gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-2 text-destructive hover:text-destructive"
                            onClick={() => deleteGoal(goal.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === "rules" && (
            <div className="space-y-4">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add New Rule
              </Button>

              {rules.length === 0 ? (
                <Card className="p-12 bg-card border-border text-center">
                  <p className="text-muted-foreground">No rules yet. Create one to get started!</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <Card key={rule.id} className={cn("p-4 bg-card border-border", !rule.is_active && "opacity-60")}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={rule.is_active}
                              onChange={() => toggleRuleActive(rule.id, rule.is_active)}
                              className="w-4 h-4 rounded"
                            />
                            <h3 className="font-semibold text-foreground">{rule.title}</h3>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Playbooks Tab */}
          {activeTab === "playbooks" && (
            <div className="space-y-4">
              <Button 
                className="gap-2"
                onClick={() => setShowPlaybookChoice(true)}
              >
                <Plus className="w-4 h-4" />
                Add New Playbook
              </Button>

              {playbooks.length === 0 ? (
                <Card className="p-12 bg-card border-border text-center">
                  <p className="text-muted-foreground">No playbooks yet. Create one to get started!</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playbooks.map((playbook) => (
                    <Card key={playbook.id} className="p-6 bg-card border-border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          {playbook.color && (
                            <div 
                              className="w-4 h-4 rounded flex-shrink-0 mt-1"
                              style={{ backgroundColor: playbook.color }}
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-foreground">{playbook.title}</h3>
                            {playbook.description && (
                              <p className="text-sm text-muted-foreground mt-1">{playbook.description}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => deletePlaybook(playbook.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {playbook.rules && (playbook.rules.entry.length > 0 || playbook.rules.exit.length > 0) && (
                        <div className="pt-4 border-t border-border space-y-3 text-sm">
                          {playbook.rules.entry.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Entry Criteria: {playbook.rules.entry.length} rule(s)</p>
                            </div>
                          )}
                          {playbook.rules.exit.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Exit Criteria: {playbook.rules.exit.length} rule(s)</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Playbook Choice Modal */}
      {showPlaybookChoice && !showCreatePlaybookForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Create or Browse</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlaybookChoice(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Would you like to create a new playbook or browse templates?</p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-3 p-4"
                  onClick={() => setShowCreatePlaybookForm(true)}
                >
                  <Plus className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-medium text-sm">Create New</p>
                    <p className="text-xs text-muted-foreground">Build from scratch</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col gap-3 p-4"
                  onClick={() => {
                    setShowPlaybookChoice(false)
                    router.push('/dashboard/templates')
                  }}
                >
                  <BookOpen className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-medium text-sm">Browse</p>
                    <p className="text-xs text-muted-foreground">From templates</p>
                  </div>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Playbook Form Modal */}
      {showCreatePlaybookForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="my-8">
            <CreatePlaybookForm
              onSubmit={handleCreatePlaybook}
              onCancel={() => {
                setShowCreatePlaybookForm(false)
                setShowPlaybookChoice(true)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
