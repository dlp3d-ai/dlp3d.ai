import { NextRequest, NextResponse } from 'next/server'

// Preset reply messages
const autoReplies = [
  '我明白你的想法，让我们继续探索这个话题。',
  '这是个很有趣的观点，能详细说说吗？',
  '我完全理解你的感受，让我们一起深入讨论。',
  '你说得对，这确实值得思考。',
  '我很好奇你为什么会这么想？',
  '这个想法很有创意，我很感兴趣。',
  '让我们从另一个角度来思考这个问题。',
  '你说得很有道理，我完全同意。',
  '这让我想起了一个有趣的故事...',
  '我感受到了你的热情，这很棒！',
]

/**
 * Handle mock LLM chat completion requests.
 *
 * Simulates processing by waiting a short random delay and returns a random
 * reply from a preset list. Intended for development/testing without calling
 * a real LLM provider.
 *
 * @param request The incoming Next.js request containing JSON with a `message` field.
 *
 * @returns A JSON response with `success`, mocked `data` including `message`,
 * `timestamp`, and `model` when successful; otherwise an error payload with
 * HTTP status 500.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    await request.json()

    // Simulate processing latency
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Select a random reply
    const randomIndex = Math.floor(Math.random() * autoReplies.length)
    const reply = autoReplies[randomIndex]

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        message: reply,
        timestamp: new Date().toISOString(),
        model: 'mock-llm-v1',
      },
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing the request',
      },
      { status: 500 },
    )
  }
}

/**
 * Health-check endpoint for the mock LLM API.
 *
 * Provides a simple JSON payload describing the endpoint and how to use it.
 *
 * @returns A JSON response indicating the API is running and usage info.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Mock LLM API is running',
    availableEndpoints: ['POST /api/LLM'],
    description:
      "Send a POST request with a 'message' field to get a mock LLM response",
  })
}
