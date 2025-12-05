import type { NextRequest } from "next/server"
import { generateWithModel, type ChatMessage } from "@/lib/huggingface-client"
import { rateLimit, getRateLimitInfo } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    if (!rateLimit(clientIp, 10, 60000)) {
      const { remaining, resetTime } = getRateLimitInfo(clientIp)
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          remaining,
          resetTime,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    const body = await request.json()
    const { messages, modelId } = body as { messages: ChatMessage[]; modelId: string }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "At least one message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generateWithModel(modelId || "deepseek-v3.2", messages)) {
            const data = JSON.stringify(chunk) + "\n"
            controller.enqueue(encoder.encode(`data: ${data}\n`))
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
