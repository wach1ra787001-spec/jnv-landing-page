import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Extract user from auth token
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // If no subscription exists, create free tier by default
    if (!subscription) {
      const { data: newSub } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          tier: "free",
          status: "active",
        })
        .select()
        .single()

      return new Response(
        JSON.stringify({
          subscription: newSub,
          is_premium: false,
          has_access: { ai_coach: true, trade_journal: true, analytics: false },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // Determine feature access based on tier
    const access = {
      ai_coach: subscription.tier !== "free",
      trade_journal: true,
      analytics: subscription.tier === "premium",
      api_access: subscription.tier === "premium",
      data_export: subscription.tier === "premium",
    }

    return new Response(
      JSON.stringify({
        subscription,
        is_premium: subscription.tier !== "free",
        has_access: access,
        usage: {
          ai_requests: {
            used: subscription.ai_requests_used,
            limit: subscription.ai_requests_limit,
            remaining: subscription.ai_requests_limit - subscription.ai_requests_used,
          },
          api_calls: {
            used: subscription.api_calls_used,
            limit: subscription.api_calls_limit,
            remaining: subscription.api_calls_limit - subscription.api_calls_used,
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
