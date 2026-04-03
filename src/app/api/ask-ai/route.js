import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const { question, context } = await req.json();

  if (!question?.trim()) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  const systemPrompt = context
    ? `You are an AI assistant for AnalytixLabs, a leading Data Science and AI education platform in India.
You are answering a reader's question about this article:

${context}

Guidelines:
- Be concise: 2-4 sentences max
- Be practical and actionable
- Reference the article content when relevant
- Use simple language suitable for learners`
    : `You are an AI assistant for AnalytixLabs, a leading Data Science and AI education platform in India.
Help readers explore Data Science, Machine Learning, AI, Analytics, and career topics.
Guidelines:
- Be concise: 2-4 sentences max
- Be practical and actionable
- Mention relevant AnalytixLabs courses when helpful
- Use simple language suitable for learners`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = await client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: "user", content: question.trim() }],
        });

        for await (const chunk of messageStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode("\n\nSorry, something went wrong. Please try again."));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
