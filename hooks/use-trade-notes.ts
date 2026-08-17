import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TradeNote {
  id: string
  note: string
  created_at: string
  user_id?: string
  trade_id?: string
}

export function useTradeNotes(tradeId: string) {
  const supabase = createClient()
  const [notes, setNotes] = useState<TradeNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/trades/${tradeId}/notes`)
        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Failed to fetch notes: HTTP ${response.status}`)
        }
        const data = await response.json()
        setNotes(data)
        setError(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch notes'
        setError(errorMsg)
        console.error('[v0] Fetch notes error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [tradeId])

  // Subscribe to realtime updates
  useEffect(() => {
    console.log('[v0] Setting up realtime subscription for trade:', tradeId)
    
    const channel = supabase
      .channel(`trade_notes:${tradeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_notes',
          filter: `trade_id=eq.${tradeId}`,
        },
        (payload) => {
          console.log('[v0] Realtime INSERT event received:', payload)
          const newNote = payload.new as TradeNote
          
          // Only add if trade_id matches (safety check)
          if (newNote.trade_id === tradeId) {
            console.log('[v0] Adding note via realtime:', newNote.id)
            setNotes((prev) => {
              // Check if note already exists to avoid duplicates
              if (prev.some(n => n.id === newNote.id)) {
                console.log('[v0] Note already exists, skipping duplicate')
                return prev
              }
              const updated = [...prev, newNote].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
              console.log('[v0] Total notes after realtime update:', updated.length)
              return updated
            })
          } else {
            console.warn('[v0] Received INSERT for different trade_id:', newNote.trade_id)
          }
        }
      )
      .subscribe((status) => {
        console.log('[v0] Realtime subscription status:', status)
      })

    return () => {
      console.log('[v0] Unsubscribing from realtime channel')
      channel.unsubscribe()
    }
  }, [tradeId, supabase])

  const addNote = async (noteContent: string): Promise<TradeNote | null> => {
    try {
      console.log('[v0] Adding note to trade:', tradeId)
      const response = await fetch(`/api/trades/${tradeId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteContent }),
      })

      console.log('[v0] Add note response status:', response.status)
      
      if (!response.ok) {
        let errorData: any = { error: `HTTP ${response.status}` }
        try {
          const text = await response.text()
          console.log('[v0] Error response body:', text)
          if (text && text.length > 0) {
            errorData = JSON.parse(text)
          }
        } catch (parseErr) {
          console.error('[v0] Failed to parse error response:', parseErr)
        }
        console.error('[v0] Add note failed:', errorData)
        throw new Error(errorData.error || 'Failed to add note')
      }
      
      const newNote = await response.json()
      console.log('[v0] New note returned:', newNote)
      
      if (!newNote || !newNote.id) {
        throw new Error('Invalid response: no note ID returned')
      }
      
      // Note will be added via realtime subscription, but add it here for immediate feedback
      setNotes((prev) => {
        const updated = [...prev, newNote].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        console.log('[v0] Notes updated. Total notes:', updated.length)
        return updated
      })
      setError(null)  // Clear any previous errors
      return newNote
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add note'
      console.error('[v0] Add note error:', err)
      setError(errorMsg)
      return null
    }
  }

  return { notes, isLoading, error, addNote }
}
