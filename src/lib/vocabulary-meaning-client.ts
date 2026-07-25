export async function fetchVocabularyMeaning(text: string, sentence?: string) {
  const response = await fetch("/api/ai/explain-vocabulary", {
    body: JSON.stringify({ sentence, text }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("vocabulary_meaning_request_failed");
  }

  const data = (await response.json()) as { meaning?: string };

  return data.meaning?.trim() ?? "";
}
