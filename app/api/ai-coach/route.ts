import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!message) {
      return Response.json({ error: "Missing message" }, { status: 400 })
    }

    // Get user's session token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return Response.json({ error: "No active session" }, { status: 401 })
    }

    // Call the Edge Function with user token
    // All business logic (subscription check, usage tracking, API calls) happens in the Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-coach`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, context }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return Response.json(data, { status: response.status })
    }

    return Response.json(data)
  } catch (error) {
    console.error("Error in AI coach:", error)
    return Response.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    )
  }
}
