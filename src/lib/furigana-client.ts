import type { FuriganaSegment } from "@/lib/furigana";

export async function fetchFuriganaSegments(text: string, signal?: AbortSignal) {
  const response = await fetch("/api/furigana", {
    body: JSON.stringify({ text }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    throw new Error("furigana_request_failed");
  }

  const data = (await response.json()) as { segments?: FuriganaSegment[] };

  return data.segments ?? [];
}

export async function fetchVocabularyReading(text: string) {
  const segments = await fetchFuriganaSegments(text);
  const reading = segments
    .map((segment) => {
      if (segment.type === "newline") {
        return "";
      }

      if (segment.type === "ruby") {
        return segment.reading;
      }

      return extractKana(segment.text);
    })
    .join("")
    .trim();

  return reading || "";
}

function extractKana(text: string) {
  return text
    .replace(/[\u30a1-\u30f3]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[^\u3040-\u309fー]/g, "");
}
