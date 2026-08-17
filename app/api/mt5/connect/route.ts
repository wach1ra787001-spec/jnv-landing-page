import { createClient } from '@/lib/supabase/server'

import { NextRequest, NextResponse } from 'next/server'

interface MT5ConnectionRequest {
  accountNumber: string
  serverName: string
  investorPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: MT5ConnectionRequest = await request.json()

    // Validate input
    if (!body.accountNumber?.trim() || !body.serverName?.trim() || !body.investorPassword?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Call Python bridge to validate MT5 connection
    const pythonBridgeUrl = process.env.PYTHON_BRIDGE_URL || 'http://localhost:8000'
    const response = await fetch(`${pythonBridgeUrl}/api/mt5/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_number: body.accountNumber,
        server_name: body.serverName,
        investor_password: body.investorPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Failed to connect MT5 account' },
        { status: response.status }
      )
    }

    const { connection_token } = await response.json()

    // Store connection in database (encrypted)
    const { error: dbError } = await supabase
      .from('broker_connections')
      .upsert({
        user_id: user.id,
        broker_type: 'mt5',
        account_number: body.accountNumber,
        server_name: body.serverName,
        connection_token,
        status: 'connected',
        last_sync: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to save connection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'MT5 account connected successfully',
    })
  } catch (error) {
    console.error('MT5 connection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
