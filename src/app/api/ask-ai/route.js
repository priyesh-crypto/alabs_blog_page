import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: systemPrompt,
          generationConfig: { maxOutputTokens: 300 },
        });

        const result = await model.generateContentStream(question.trim());

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
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
