export async function POST(request: Request) {
  try {
    // Simple liveness check - just return 200 OK
    // The EA uses this to measure round-trip latency
    return new Response(
      JSON.stringify({ status: 'ok' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Ping error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
