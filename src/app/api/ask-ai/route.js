import { GoogleGenerativeAI } from "@google/generative-ai";

// Validate API key at startup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[ask-ai] GEMINI_API_KEY is not set — AI endpoint will return errors.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Basic in-memory rate limiter (per IP, resets on cold-start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req) {
  // Rate-limit check
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // API key guard
  if (!genAI) {
    return Response.json({ error: "AI service is not configured." }, { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { question, context } = body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  // Sanitize — trim and cap length
  const sanitizedQuestion = question.trim().slice(0, 500);

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

        const result = await model.generateContentStream(sanitizedQuestion);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[ask-ai] Generation error:", err.message);
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
