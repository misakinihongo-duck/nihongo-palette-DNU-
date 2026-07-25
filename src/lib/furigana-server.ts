import path from "node:path";
import kuromoji from "kuromoji";
import type { IpadicFeatures, Tokenizer } from "kuromoji";
import type { FuriganaSegment } from "@/lib/furigana";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export async function buildFuriganaSegmentsWithKuromoji(text: string): Promise<FuriganaSegment[]> {
  const source = text.trim();

  if (!source) {
    return [{ type: "text", text: "ここに作文を書くと、読むモードでルビ表示されます。" }];
  }

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(source);
  const segments: FuriganaSegment[] = [];
  let cursor = 0;

  for (const token of tokens) {
    const tokenStart = Math.max(token.word_position - 1, cursor);
    const tokenEnd = tokenStart + token.surface_form.length;

    if (tokenStart > cursor) {
      pushPlainText(segments, source.slice(cursor, tokenStart));
    }

    const surface = source.slice(tokenStart, tokenEnd) || token.surface_form;
    const reading = getTokenReading(token, surface);

    if (reading && shouldShowRuby(surface)) {
      segments.push({ type: "ruby", text: surface, reading });
    } else {
      pushPlainText(segments, surface);
    }

    cursor = tokenEnd;
  }

  if (cursor < source.length) {
    pushPlainText(segments, source.slice(cursor));
  }

  return segments;
}

function getTokenizer() {
  tokenizerPromise ??= new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.join(process.cwd(), "node_modules/kuromoji/dict") })
      .build((error, tokenizer) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(tokenizer);
      });
  });

  return tokenizerPromise;
}

function getTokenReading(token: IpadicFeatures, surface: string) {
  const reading = token.reading && token.reading !== "*" ? token.reading : surface;
  const hiragana = katakanaToHiragana(reading);

  if (hiragana === surface && !katakanaPattern.test(surface)) {
    return "";
  }

  return hiragana;
}

function shouldShowRuby(surface: string) {
  return kanjiPattern.test(surface) || katakanaPattern.test(surface);
}

function pushPlainText(segments: FuriganaSegment[], text: string) {
  for (const chunk of text.split(/(\n)/)) {
    if (!chunk) {
      continue;
    }

    if (chunk === "\n") {
      segments.push({ type: "newline" });
    } else {
      segments.push({ type: "text", text: chunk });
    }
  }
}

function katakanaToHiragana(text: string) {
  return [...text]
    .map((char) => {
      const code = char.charCodeAt(0);

      if (code >= 0x30a1 && code <= 0x30f3) {
        return String.fromCharCode(code - 0x60);
      }

      return char;
    })
    .join("");
}

const kanjiPattern = /[\u3400-\u9fff]/;
const katakanaPattern = /[\u30a0-\u30ff]/;
