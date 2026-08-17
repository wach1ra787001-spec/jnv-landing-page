import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS
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

    // Initialize Supabase client with service role (backend only)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    )

    // Get user from token
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const userId = user.id

    // Fetch user's subscription to check tier and usage limits
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("tier, ai_requests_limit, ai_requests_used")
      .eq("user_id", userId)
      .single()

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check if user has exceeded AI request limit
    if (subscription.ai_requests_used >= subscription.ai_requests_limit) {
      return new Response(
        JSON.stringify({
          error: "AI request limit exceeded",
          limit: subscription.ai_requests_limit,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      )
    }

    // Parse request body
    const { message, context } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message field" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Call OpenAI API (secret key only on backend)
    const openaiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert trading coach helping traders improve their performance through journaling and behavioral analysis.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    const openaiData = await openaiResponse.json()

    if (!openaiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const aiMessage = openaiData.choices[0].message.content
    const tokensUsed = openaiData.usage.total_tokens

    // Log the AI request (for usage tracking)
    await supabaseAdmin.from("ai_request_logs").insert({
      user_id: userId,
      request_type: "coaching",
      prompt_tokens: openaiData.usage.prompt_tokens,
      completion_tokens: openaiData.usage.completion_tokens,
      total_tokens: tokensUsed,
      status: "success",
    })

    // Decrement AI request usage (server-side only)
    await supabaseAdmin
      .from("subscriptions")
      .update({
        ai_requests_used: subscription.ai_requests_used + 1,
      })
      .eq("user_id", userId)

    // Log usage for audit trail
    await supabaseAdmin.from("usage_logs").insert({
      user_id: userId,
      operation_type: "ai_request",
      operation_count: 1,
      metadata: {
        tokens_used: tokensUsed,
        request_type: "coaching",
      },
    })

    return new Response(
      JSON.stringify({
        message: aiMessage,
        tokens_used: tokensUsed,
        requests_remaining: subscription.ai_requests_limit - (subscription.ai_requests_used + 1),
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
