export type FuriganaSegment =
  | { type: "text"; text: string }
  | { type: "ruby"; text: string; reading: string }
  | { type: "newline" };

const readingMap: Record<string, string> = {
  私: "わたし",
  僕: "ぼく",
  今日: "きょう",
  明日: "あした",
  昨日: "きのう",
  先週: "せんしゅう",
  今週: "こんしゅう",
  来週: "らいしゅう",
  週末: "しゅうまつ",
  土曜日: "どようび",
  日曜日: "にちようび",
  月曜日: "げつようび",
  火曜日: "かようび",
  水曜日: "すいようび",
  木曜日: "もくようび",
  金曜日: "きんようび",
  友だち: "ともだち",
  友達: "ともだち",
  鎌倉: "かまくら",
  東京: "とうきょう",
  京都: "きょうと",
  大阪: "おおさか",
  学校: "がっこう",
  日本語: "にほんご",
  漢字: "かんじ",
  名前: "なまえ",
  大学: "だいがく",
  学生: "がくせい",
  授業: "じゅぎょう",
  言葉: "ことば",
  勉強: "べんきょう",
  作文: "さくぶん",
  宿題: "しゅくだい",
  先生: "せんせい",
  生徒: "せいと",
  家族: "かぞく",
  友人: "ゆうじん",
  旅行: "りょこう",
  買い物: "かいもの",
  映画: "えいが",
  音楽: "おんがく",
  天気: "てんき",
  公園: "こうえん",
  駅: "えき",
  電車: "でんしゃ",
  時間: "じかん",
  朝: "あさ",
  昼: "ひる",
  夜: "よる",
  少し: "すこし",
  早く: "はやく",
  ご飯: "ごはん",
  食事: "しょくじ",
  料理: "りょうり",
  部屋: "へや",
  会社: "かいしゃ",
  仕事: "しごと",
  毎日: "まいにち",
  毎週: "まいしゅう",
  毎月: "まいつき",
  "3月": "さんがつ",
  "4月": "しがつ",
  下旬: "げじゅん",
  本: "ほん",
  文化: "ぶんか",
  日本: "にほん",
  食べ物: "たべもの",
  将来: "しょうらい",
  夢: "ゆめ",
  新しい: "あたらしい",
  古い: "ふるい",
  短い: "みじかい",
  温かい: "あたたかい",
  明るい: "あかるい",
  明るく: "あかるく",
  楽しい: "たのしい",
  気持ち: "きもち",
  好き: "すき",
  大切: "たいせつ",
  有名: "ゆうめい",
  春: "はる",
  夏: "なつ",
  秋: "あき",
  冬: "ふゆ",
  桜: "さくら",
  花: "はな",
  花見: "はなみ",
  町: "まち",
  川: "かわ",
  川のそば: "かわのそば",
  広がり方: "ひろがりかた",
  見ごろ: "みごろ",
  土曜: "どよう",
  弁当: "べんとう",
  歌: "うた",
  風: "かぜ",
  地面: "じめん",
  近く: "ちかく",
  同じ: "おなじ",
  いきました: "いきました",
  行きました: "いきました",
  行った: "いった",
  行く: "いく",
  行きます: "いきます",
  起きて: "おきて",
  海: "うみ",
  お寺: "おてら",
  神社: "じんじゃ",
  見ました: "みました",
  見られます: "みられます",
  見る: "みる",
  見ます: "みます",
  乗りました: "のりました",
  咲いて: "さいて",
  咲きます: "さきます",
  変わります: "かわります",
  出かける: "でかける",
  多い: "おおい",
  食べたり: "たべたり",
  聞いたり: "きいたり",
  散る: "ちる",
  舞い: "まい",
  帰る: "かえる",
  買いました: "かいました",
  食べました: "たべました",
  食べる: "たべる",
  食べます: "たべます",
  書いた: "かいた",
  書きました: "かきました",
  書く: "かく",
  書きます: "かきます",
  読んだ: "よんだ",
  読みました: "よみました",
  読む: "よむ",
  読みます: "よみます",
  話した: "はなした",
  話して: "はなして",
  話す: "はなす",
  話します: "はなします",
  考える: "かんがえる",
  考えます: "かんがえます",
  鎌倉に: "かまくらに",
  楽しかった: "たのしかった",
  場所: "ばしょ",
  一日: "いちにち",
};

const sortedWords = Object.keys(readingMap).sort((left, right) => right.length - left.length);
const kanjiReadingMap: Record<string, string> = {
  私: "わたし",
  僕: "ぼく",
  今: "いま",
  日: "にち",
  明: "あ",
  昨: "きのう",
  先: "せん",
  週: "しゅう",
  末: "まつ",
  月: "げつ",
  火: "か",
  水: "すい",
  木: "もく",
  金: "きん",
  土: "ど",
  友: "とも",
  達: "だち",
  鎌: "かま",
  倉: "くら",
  東: "とう",
  京: "きょう",
  大: "おお",
  阪: "さか",
  学: "がく",
  校: "こう",
  漢: "かん",
  字: "じ",
  名: "な",
  前: "まえ",
  授: "じゅ",
  業: "ぎょう",
  言: "こと",
  葉: "ば",
  語: "ご",
  勉: "べん",
  強: "きょう",
  作: "さく",
  文: "ぶん",
  宿: "しゅく",
  題: "だい",
  生: "せい",
  家: "か",
  族: "ぞく",
  人: "じん",
  旅: "りょ",
  買: "か",
  物: "もの",
  映: "えい",
  画: "が",
  音: "おん",
  楽: "がく",
  天: "てん",
  気: "き",
  公: "こう",
  園: "えん",
  駅: "えき",
  電: "でん",
  車: "しゃ",
  時: "じ",
  間: "かん",
  朝: "あさ",
  昼: "ひる",
  夜: "よる",
  少: "すこ",
  早: "はや",
  飯: "はん",
  食: "た",
  事: "じ",
  料: "りょう",
  理: "り",
  部: "へ",
  屋: "や",
  会: "かい",
  社: "しゃ",
  仕: "し",
  毎: "まい",
  本: "ほん",
  化: "か",
  将: "しょう",
  来: "らい",
  夢: "ゆめ",
  春: "はる",
  夏: "なつ",
  秋: "あき",
  冬: "ふゆ",
  桜: "さくら",
  花: "はな",
  町: "まち",
  川: "かわ",
  広: "ひろ",
  方: "かた",
  新: "あたら",
  古: "ふる",
  短: "みじか",
  温: "あたた",
  近: "ちか",
  店: "みせ",
  同: "おな",
  弁: "べん",
  当: "とう",
  歌: "うた",
  風: "かぜ",
  舞: "ま",
  地: "じ",
  好: "す",
  切: "せつ",
  有: "ゆう",
  行: "い",
  起: "お",
  海: "うみ",
  寺: "てら",
  神: "じん",
  見: "み",
  乗: "の",
  咲: "さ",
  庭: "にわ",
  帰: "かえ",
  場: "ば",
  所: "しょ",
  書: "か",
  読: "よ",
  話: "はな",
  考: "かんが",
};

const kanjiPattern = /[\u3400-\u9fff]/;
const katakanaPattern = /[\u30a0-\u30ff]/;

export function buildFuriganaSegments(text: string): FuriganaSegment[] {
  const trimmed = text.trim();

  if (!trimmed) {
    return [{ type: "text", text: "ここに作文を書くと、読むモードでルビ表示されます。" }];
  }

  const segments: FuriganaSegment[] = [];
  let index = 0;

  while (index < trimmed.length) {
    if (trimmed[index] === "\n") {
      segments.push({ type: "newline" });
      index += 1;
      continue;
    }

    const matchedWord = sortedWords.find((word) => trimmed.startsWith(word, index));

    if (matchedWord) {
      segments.push({
        type: "ruby",
        text: matchedWord,
        reading: readingMap[matchedWord],
      });
      index += matchedWord.length;
      continue;
    }

    if (kanjiPattern.test(trimmed[index])) {
      const nextIndex = findUnknownKanjiEnd(trimmed, index);
      const text = trimmed.slice(index, nextIndex);
      segments.push({ type: "ruby", text, reading: buildFallbackReading(text) });

      index = nextIndex;
      continue;
    }

    if (katakanaPattern.test(trimmed[index])) {
      const nextIndex = findKatakanaEnd(trimmed, index);
      const text = trimmed.slice(index, nextIndex);
      segments.push({ type: "ruby", text, reading: katakanaToHiragana(text) });
      index = nextIndex;
      continue;
    }

    let nextIndex = index + 1;

    while (nextIndex < trimmed.length) {
      if (trimmed[nextIndex] === "\n") {
        break;
      }
      const nextMatchedWord = sortedWords.find((word) => trimmed.startsWith(word, nextIndex));

      if (nextMatchedWord) {
        break;
      }

      if (kanjiPattern.test(trimmed[nextIndex]) || katakanaPattern.test(trimmed[nextIndex])) {
        break;
      }

      nextIndex += 1;
    }

    segments.push({ type: "text", text: trimmed.slice(index, nextIndex) });
    index = nextIndex;
  }

  return segments;
}

function findKatakanaEnd(text: string, start: number) {
  let index = start + 1;

  while (index < text.length) {
    if (!katakanaPattern.test(text[index])) {
      break;
    }

    index += 1;
  }

  return index;
}

function findUnknownKanjiEnd(text: string, start: number) {
  let index = start + 1;

  while (index < text.length) {
    if (text[index] === "\n") {
      break;
    }

    if (sortedWords.some((word) => text.startsWith(word, index))) {
      break;
    }

    if (!kanjiPattern.test(text[index])) {
      break;
    }

    index += 1;
  }

  return index;
}

function buildFallbackReading(text: string) {
  return [...text].map((char) => kanjiReadingMap[char] ?? char).join("");
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

export function buildFuriganaPreview(text: string) {
  return buildFuriganaSegments(text)
    .map((segment) => {
      if (segment.type === "newline") {
        return "\n";
      }

      if (segment.type === "ruby") {
        return `${segment.text}(${segment.reading})`;
      }

      return segment.text;
    })
    .join("");
}

export function guessReading(word: string) {
  return readingMap[word] ?? "";
}
