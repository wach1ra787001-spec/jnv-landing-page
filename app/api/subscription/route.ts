import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the Edge Function with user token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-subscription`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Edge Function error: ${response.statusText}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return Response.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    )
  }
}
