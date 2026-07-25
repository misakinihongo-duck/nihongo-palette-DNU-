type JudgeTone = "correct" | "close" | "incorrect";

type JudgeVocabularyRequest = {
  answer?: string;
  example?: string;
  meaning?: string;
  reading?: string;
  word?: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const judgeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    label: { type: "string", enum: ["正解", "おしい", "不正解"] },
    tone: { type: "string", enum: ["correct", "close", "incorrect"] },
    message: { type: "string" },
  },
  required: ["label", "tone", "message"],
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

  const payload = (await request.json()) as JudgeVocabularyRequest;
  const word = cleanText(payload.word, "");
  const reading = cleanText(payload.reading, "");
  const meaning = cleanText(payload.meaning, "");
  const answer = cleanText(payload.answer, "");
  const example = cleanText(payload.example, "");

  if (!word || !answer) {
    return Response.json(
      {
        label: "不正解",
        tone: "incorrect",
        message: "単語と回答を入力してから判定しましょう。",
      },
      { status: 400 }
    );
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
            "You are a Japanese vocabulary teacher. Judge whether a learner's meaning answer matches the Japanese word or grammar expression. Return only valid JSON.",
        },
        {
          role: "user",
          content: [
            `Japanese item: ${word}`,
            reading ? `Reading: ${reading}` : "Reading: unknown",
            meaning ? `Expected meaning/explanation: ${meaning}` : "Expected meaning/explanation: unknown",
            example ? `Example/context: ${example}` : "Example/context: none",
            `Learner answer: ${answer}`,
            "Classify the learner answer into exactly one of: correct, close, incorrect.",
            "Use correct only if the answer gives the specific dictionary meaning of the item. Synonyms are okay, but the answer must include the distinguishing meaning or function.",
            "Use close if the answer is partially right, is only a broad category, is too vague, or misses the key distinguishing detail.",
            "For example, if the item is 駅 and the expected meaning is station / a place where trains or buses stop, 'station' is correct but 'place' is only close.",
            "Use incorrect if the answer is the wrong category, wrong meaning, or unrelated.",
            "Return Japanese label text and a short Japanese message for the learner.",
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "nihongo_palette_vocabulary_judgement",
          strict: true,
          schema: judgeSchema,
        },
      },
      max_completion_tokens: 250,
    }),
  });

  if (!openAiResponse.ok) {
    const errorText = await openAiResponse.text();
    const openAiError = parseOpenAiError(errorText);

    return Response.json(
      {
        error: "OpenAI vocabulary judgement failed.",
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
    const parsed = JSON.parse(content) as { label?: string; message?: string; tone?: JudgeTone };
    const normalizedTone = normalizeTone(parsed.tone);

    if (normalizedTone === "correct" && isGenericAnswerTooBroad(answer, meaning)) {
      return Response.json({
        label: "おしい",
        tone: "close",
        message:
          "方向は近いですが、辞書的な意味としては少し広すぎます。何の場所・もの・動作なのかをもう少し具体的に答えましょう。",
      });
    }

    return Response.json({
      label: normalizeLabel(parsed.label, normalizedTone),
      tone: normalizedTone,
      message: parsed.message || "判定しました。",
    });
  } catch {
    return Response.json({ error: "OpenAI response was not valid JSON." }, { status: 502 });
  }
}

function cleanText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function normalizeTone(tone: JudgeTone | undefined): JudgeTone {
  return tone === "correct" || tone === "close" || tone === "incorrect" ? tone : "incorrect";
}

function normalizeLabel(label: string | undefined, tone: JudgeTone | undefined) {
  if (label === "正解" || label === "おしい" || label === "不正解") {
    return label;
  }

  const normalizedTone = normalizeTone(tone);

  if (normalizedTone === "correct") {
    return "正解";
  }

  if (normalizedTone === "close") {
    return "おしい";
  }

  return "不正解";
}

function isGenericAnswerTooBroad(answer: string, meaning: string) {
  const normalizedAnswer = normalizeMeaningText(answer);
  const normalizedMeaning = normalizeMeaningText(meaning);
  const broadAnswers = new Set([
    "area",
    "location",
    "object",
    "person",
    "place",
    "something",
    "somewhere",
    "spot",
    "stuff",
    "thing",
    "こと",
    "ところ",
    "もの",
    "ばしょ",
    "ひと",
    "人",
    "場所",
    "所",
    "物",
  ]);

  if (!broadAnswers.has(normalizedAnswer)) {
    return false;
  }

  return normalizedMeaning !== normalizedAnswer;
}

function normalizeMeaningText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]{}、。！？「」『』（）]/g, "")
    .replace(/\s+/g, " ");
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
