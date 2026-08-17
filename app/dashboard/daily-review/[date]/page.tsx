'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const emotionTagsBeforeEntry = ['Confident', 'Fearful', 'Hesitant', 'Overexcited', 'Patient', 'Rushed']
const emotionTagsDuringTrade = ['Calm', 'Anxious', 'Doubtful', 'Disciplined', 'Tempted to close early', 'Tempted to move stop loss']
const reflectionOptions = ['Followed my rules', 'Slight deviations', 'Broke my system', 'Emotional trading', 'Good discipline']
const tradeTagOptions = ['Breakout', 'Reversal', 'Liquidity Sweep', 'Continuation', 'Scalp', 'Swing']

export default function DailyReviewPage() {
  const params = useParams()
  const router = useRouter()
  const date = params.date as string

  // Form state
  const [beforeEntryEmotions, setBeforeEntryEmotions] = useState<string[]>([])
  const [beforeEntryNotes, setBeforeEntryNotes] = useState('')
  const [duringTradeEmotions, setDuringTradeEmotions] = useState<string[]>([])
  const [duringTradeNotes, setDuringTradeNotes] = useState('')
  const [reflectionValue, setReflectionValue] = useState('')
  const [reflectionNotes, setReflectionNotes] = useState('')
  const [stressLevel, setStressLevel] = useState(5)
  const [confidenceLevel, setConfidenceLevel] = useState(5)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [disciplineScore, setDisciplineScore] = useState(82)

  const handleEmotionToggle = (emotion: string, setter: any, state: string[]) => {
    if (state.includes(emotion)) {
      setter(state.filter(e => e !== emotion))
    } else {
      setter([...state, emotion])
    }
  }

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-foreground">Daily Review</h1>
          <p className="text-muted-foreground">Daily Review — {date}</p>
        </div>
      </div>

      {/* Discipline Score */}
      <Card className="p-6 bg-card border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Daily Discipline Score</h3>
            <p className="text-sm text-muted-foreground">Based on rule adherence and trading behavior</p>
          </div>
          <div className="text-4xl font-bold text-[#2674D9]">{disciplineScore}<span className="text-xl text-muted-foreground">/100</span></div>
        </div>
      </Card>

      {/* Three Horizontal Review Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Card 1: Before Entry */}
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">How did you feel before entering trades?</h3>
          
          <div className="space-y-3 mb-6">
            {emotionTagsBeforeEntry.map((emotion) => (
              <button
                key={emotion}
                onClick={() => handleEmotionToggle(emotion, setBeforeEntryEmotions, beforeEntryEmotions)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
                  beforeEntryEmotions.includes(emotion)
                    ? 'bg-[#2674D9] text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                {emotion}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Add notes about your mindset before trading."
            value={beforeEntryNotes}
            onChange={(e) => setBeforeEntryNotes(e.target.value)}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm resize-none"
            rows={4}
          />
        </Card>

        {/* Card 2: During Trade */}
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Emotions during the trade</h3>
          
          <div className="space-y-3 mb-6">
            {emotionTagsDuringTrade.map((emotion) => (
              <button
                key={emotion}
                onClick={() => handleEmotionToggle(emotion, setDuringTradeEmotions, duringTradeEmotions)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
                  duringTradeEmotions.includes(emotion)
                    ? 'bg-[#2674D9] text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                {emotion}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Add notes about emotions during trading."
            value={duringTradeNotes}
            onChange={(e) => setDuringTradeNotes(e.target.value)}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm resize-none"
            rows={4}
          />
        </Card>

        {/* Card 3: End of Day Reflection */}
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Overall reflection of your trading day</h3>
          
          <div className="space-y-3 mb-6">
            {reflectionOptions.map((option) => (
              <button
                key={option}
                onClick={() => setReflectionValue(option)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left',
                  reflectionValue === option
                    ? 'bg-[#2674D9] text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Add your reflection notes."
            value={reflectionNotes}
            onChange={(e) => setReflectionNotes(e.target.value)}
            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm resize-none"
            rows={4}
          />
        </Card>
      </div>

      {/* Psychological Inputs - Sliders */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Stress Level</h3>
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-[#2674D9]">{stressLevel}</span>
              <span className="text-muted-foreground"> / 10</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">Confidence Level</h3>
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="10"
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-[#2674D9]">{confidenceLevel}</span>
              <span className="text-muted-foreground"> / 10</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Trade Tags */}
      <Card className="p-6 bg-card border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">Trade Tags</h3>
        <div className="grid grid-cols-3 gap-3">
          {tradeTagOptions.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                selectedTags.includes(tag)
                  ? 'bg-[#2674D9] text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </Card>

      {/* Screenshot Attachment */}
      <Card className="p-6 bg-card border border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">Attach Chart Screenshot</h3>
        <button className="w-full px-4 py-3 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <Upload className="w-5 h-5" />
          Drop screenshots or click to browse
        </button>
      </Card>

      {/* AI Performance Insight (Premium Only) */}
      <Card className="p-6 bg-card border border-[#2674D9]/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Performance Insight</h3>
            <p className="text-sm text-muted-foreground">Premium feature - AI analysis of your trading day</p>
          </div>
          <span className="px-3 py-1 bg-[#2674D9]/20 text-[#2674D9] text-xs font-semibold rounded-full">PREMIUM</span>
        </div>
        <Button className="bg-[#2674D9] hover:bg-[#1f5ab3] text-white gap-2">
          Analyze My Day
        </Button>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button className="bg-[#2674D9] hover:bg-[#1f5ab3] text-white">Save Review</Button>
      </div>
    </div>
  )
}
