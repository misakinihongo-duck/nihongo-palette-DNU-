type ExplainVocabularyRequest = {
  text?: string;
  sentence?: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const explanationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    meaning: { type: "string" },
  },
  required: ["meaning"],
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

  const payload = (await request.json()) as ExplainVocabularyRequest;
  const text = cleanText(payload.text, "");
  const sentence = cleanText(payload.sentence, "");

  if (!text) {
    return Response.json({ meaning: "" });
  }

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
            "You explain Japanese vocabulary and grammar for a Japanese learner. Return only valid JSON.",
        },
        {
          role: "user",
          content: [
            `Selected text: ${text}`,
            sentence ? `Context sentence: ${sentence}` : "Context sentence: none",
            "If the selected text is a word, give a short English meaning.",
            "If it is a grammar pattern or phrase, explain its function/meaning briefly in English.",
            "Keep the meaning concise, ideally under 12 words.",
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "nihongo_palette_vocabulary_explanation",
          strict: true,
          schema: explanationSchema,
        },
      },
      max_completion_tokens: 200,
    }),
  });

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    const openAiError = parseOpenAiError(errorText);

    return Response.json(
      {
        error: "OpenAI vocabulary explanation failed.",
        code: openAiError?.code,
        message: openAiError?.message ?? "OpenAI API returned an error.",
      },
      { status: openAiResponse.status }
    );
  }

  const data = await openAiResponse.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return Response.json({ error: "OpenAI response did not include content." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(content) as { meaning?: string };

    return Response.json({ meaning: parsed.meaning ?? "" });
  } catch {
    return Response.json({ error: "OpenAI response was not valid JSON." }, { status: 502 });
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
