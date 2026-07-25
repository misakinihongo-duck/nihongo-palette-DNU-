import type { Student } from "@/lib/types";
import { buildFuriganaSegmentsWithKuromoji } from "@/lib/furigana-server";

type Tone = "自然" | "会話寄り" | "ビジネス寄り";

type GenerateArticleRequest = {
  topic?: string;
  level?: Student["level"];
  tone?: Tone;
  length?: string;
  studentName?: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const articleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    body: { type: "string" },
    vocabulary: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          word: { type: "string" },
          reading: { type: "string" },
          meaning: { type: "string" },
          example: { type: "string" },
        },
        required: ["word", "reading", "meaning", "example"],
      },
    },
    questions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
  },
  required: ["title", "body", "vocabulary", "questions"],
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-nano";

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as GenerateArticleRequest;
  const topic = cleanText(payload.topic, "日本の文化");
  const level = payload.level ?? "N4";
  const tone = payload.tone ?? "自然";
  const length = cleanText(payload.length, "400字程度");
  const studentName = cleanText(payload.studentName, "学習者");

  const openAiResponse = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You create short Japanese reading materials for online Japanese lessons. Return only valid JSON that matches the requested schema.",
        },
        {
          role: "user",
          content: [
            `Create one Japanese reading article for Nihongo Palette.`,
            `Learner: ${studentName}`,
            `JLPT level: ${level}`,
            `Topic: ${topic}`,
            `Tone: ${tone}`,
            `Length: ${length}`,
            "Use natural Japanese appropriate for the JLPT level.",
            "Include 3 to 5 important vocabulary items with hiragana readings, short English meanings, and article-based example sentences.",
            "Include exactly 3 conversation practice questions for the teacher view.",
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "nihongo_palette_article",
          strict: true,
          schema: articleSchema,
        },
      },
      max_completion_tokens: 3000,
    }),
  });

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    const openAiError = parseOpenAiError(errorText);

    return Response.json(
      {
        error: "OpenAI article generation failed.",
        code: openAiError?.code,
        message: openAiError?.message ?? "OpenAI API returned an error.",
      },
      { status: openAiResponse.status }
    );
  }

  const data = await openAiResponse.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return Response.json(
      { error: "OpenAI response did not include article content." },
      { status: 502 }
    );
  }

  try {
    const article = JSON.parse(content);
    const furiganaSegments = await buildFuriganaSegmentsWithKuromoji(article.body);

    return Response.json({
      ...article,
      furiganaSegments,
      model,
      topic,
      level,
      tone,
      length,
    });
  } catch {
    return Response.json(
      { error: "OpenAI response was not valid JSON." },
      { status: 502 }
    );
  }
}

function cleanText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function parseOpenAiError(errorText: string) {
  try {
    const parsed = JSON.parse(errorText);
    return {
      code: parsed.error?.code as string | undefined,
      message: parsed.error?.message as string | undefined,
    };
  } catch {
    return null;
  }
}
