type VocabularyJudgeTone = "correct" | "close" | "incorrect";

export type VocabularyJudgeResult = {
  label: string;
  message: string;
  tone: VocabularyJudgeTone;
};

export async function fetchVocabularyJudgement({
  answer,
  example,
  meaning,
  reading,
  word,
}: {
  answer: string;
  example?: string;
  meaning: string;
  reading: string;
  word: string;
}) {
  const response = await fetch("/api/ai/judge-vocabulary", {
    body: JSON.stringify({ answer, example, meaning, reading, word }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("vocabulary_judgement_request_failed");
  }

  return (await response.json()) as VocabularyJudgeResult;
}
