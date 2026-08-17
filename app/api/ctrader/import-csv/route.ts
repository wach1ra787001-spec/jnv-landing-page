import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  try {
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or too short' }, { status: 400 })
    }

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    console.log('[CSV] Headers:', headers)

    const trades = []
    const errors = []

    // Parse trade rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] })

        // cTrader CSV columns:
        // Position ID, Symbol, Direction, Volume, Entry Price,
        // Close Price, Entry Time, Close Time, Commission, 
        // Swap, Profit, Net Profit, Label

        const closePrice = row['Close Price'] ?? row['close Price']
        const isClosed = !!closePrice && closePrice !== ''

        const positionId = row['Position ID'] ?? row['position ID']
        if (!positionId) {
          errors.push(`Row ${i + 1}: Missing Position ID`)
          continue
        }

        const symbol = (row['Symbol'] ?? row['symbol'] ?? '').toUpperCase()
        const direction = (row['Direction'] ?? row['direction'] ?? '').toLowerCase()
        const volume = row['Volume'] ?? row['volume'] ?? '0'
        const entryPrice = row['Entry Price'] ?? row['entry Price'] ?? '0'
        const entryTime = row['Entry Time'] ?? row['entry Time']
        const closeTime = row['Close Time'] ?? row['close Time']

        if (!symbol || !direction || !volume || !entryPrice || !entryTime) {
          errors.push(`Row ${i + 1}: Missing required fields`)
          continue
        }

        trades.push({
          user_id:             user.id,
          source:              'ctrader',
          ctrader_position_id: parseInt(positionId),
          symbol:              symbol,
          direction:           direction === 'buy' ? 'long' : 'short',
          lot_size:            parseFloat(volume),
          quantity:            parseFloat(volume),
          entry_price:         parseFloat(entryPrice),
          exit_price:          isClosed ? parseFloat(closePrice) : null,
          entry_time:          new Date(entryTime).toISOString(),
          exit_time:           isClosed ? new Date(closeTime).toISOString() : null,
          status:              isClosed ? 'closed' : 'open',
          pnl:                 parseFloat(row['Profit'] ?? row['profit'] ?? '0'),
          commission:          parseFloat(row['Commission'] ?? row['commission'] ?? '0'),
          swap:                parseFloat(row['Swap'] ?? row['swap'] ?? '0'),
          strategy:            row['Label'] ?? row['label'] ?? null,
        })
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    console.log('[CSV] Parsed trades:', trades.length)
    if (errors.length > 0) {
      console.log('[CSV] Errors:', errors)
    }

    if (trades.length === 0) {
      return NextResponse.json({
        error: 'No valid trades found in CSV',
        details: errors.slice(0, 5),
      }, { status: 400 })
    }

    // Upsert trades into database
    const { error: upsertError } = await supabase
      .from('trades')
      .upsert(trades, {
        onConflict: 'user_id,ctrader_position_id',
      })

    if (upsertError) {
      console.error('[CSV] Upsert error:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: trades.length,
      skipped: errors.length,
      message: `${trades.length} trades imported successfully`,
    })
  } catch (err: any) {
    console.error('[CSV] Upload error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
