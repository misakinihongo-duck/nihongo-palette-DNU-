"use client";

import { useEffect, useMemo, useState } from "react";
import { students } from "@/lib/mock-data";
import { buildFuriganaSegments } from "@/lib/furigana";
import { fetchFuriganaSegments, fetchVocabularyReading } from "@/lib/furigana-client";
import {
  readLocalSavedArticles,
  upsertLocalSavedArticle,
  type LocalSavedArticle,
} from "@/lib/local-article-store";
import { fetchVocabularyMeaning } from "@/lib/vocabulary-meaning-client";
import { FIXED_STUDENT_ID } from "@/lib/supabase/constants";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { FuriganaSegment } from "@/lib/furigana";
import type { Role, Student } from "@/lib/types";

type Tone = "自然" | "会話寄り" | "ビジネス寄り";

type ArticleVocabulary = {
  id?: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
};

type GeneratedArticle = {
  id: string;
  title: string;
  body: string;
  furiganaSegments: FuriganaSegment[];
  level: Student["level"];
  topic: string;
  tone: Tone;
  length: string;
  createdAt: string;
  vocabulary: ArticleVocabulary[];
  questions: string[];
  isSaved: boolean;
};

type ApiFuriganaSegment = {
  type: "text" | "ruby" | "newline";
  text: string;
  reading: string;
};

type GeneratedArticleResponse = Pick<GeneratedArticle, "title" | "body" | "vocabulary" | "questions"> & {
  furiganaSegments?: ApiFuriganaSegment[];
  level: Student["level"];
  topic: string;
  tone: Tone;
  length: string;
  model?: string;
};

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ArticleVocabularyRow = Database["public"]["Tables"]["article_vocabulary_items"]["Row"];

const toneOptions: Tone[] = ["自然", "会話寄り", "ビジネス寄り"];
const levelOptions: Student["level"][] = ["N5", "N4", "N3", "N2", "N1"];

const initialArticle: GeneratedArticle = {
  id: "generated-1",
  title: "小さい旅の楽しみ",
  body:
    "週末、エマさんは友だちと鎌倉へ行きました。朝は少し早く起きて、電車に乗りました。鎌倉では海を見たり、古いお寺を見たりしました。お寺の庭は静かで、きれいな花も咲いていました。昼ごはんには、近くの小さい店で温かいうどんを食べました。帰る前に、おみやげを買いました。短い旅行でしたが、新しい場所を見て、とても楽しい一日になりました。",
  furiganaSegments: buildFuriganaSegments(
    "週末、エマさんは友だちと鎌倉へ行きました。朝は少し早く起きて、電車に乗りました。鎌倉では海を見たり、古いお寺を見たりしました。お寺の庭は静かで、きれいな花も咲いていました。昼ごはんには、近くの小さい店で温かいうどんを食べました。帰る前に、おみやげを買いました。短い旅行でしたが、新しい場所を見て、とても楽しい一日になりました。"
  ),
  level: "N4",
  topic: "旅行",
  tone: "自然",
  length: "400字",
  createdAt: "2026/05/11",
  vocabulary: [
    {
      word: "電車",
      reading: "でんしゃ",
      meaning: "train",
      example: "電車に乗りました。",
    },
    {
      word: "静か",
      reading: "しずか",
      meaning: "quiet",
      example: "お寺の庭は静かでした。",
    },
    {
      word: "おみやげ",
      reading: "おみやげ",
      meaning: "souvenir",
      example: "帰る前におみやげを買いました。",
    },
  ],
  questions: [
    "エマさんは週末、どこへ行きましたか。",
    "あなたは旅行で何を見るのが好きですか。",
    "最近、楽しかった一日はいつですか。",
  ],
  isSaved: false,
};

const articleHistory: GeneratedArticle[] = [
  initialArticle,
  {
    ...initialArticle,
    id: "generated-2",
    title: "カフェで勉強する日",
    topic: "カフェ",
    createdAt: "2026/05/08",
  },
  {
    ...initialArticle,
    id: "generated-3",
    title: "日本の季節を楽しむ",
    topic: "季節",
    level: "N3",
    createdAt: "2026/05/02",
  },
];

export function ArticleGeneratorClient({ role }: { role: Role }) {
  const selectedStudent = students[0];
  const [level, setLevel] = useState<Student["level"]>(selectedStudent?.level ?? "N4");
  const [tone, setTone] = useState<Tone>("自然");
  const [prompt, setPrompt] = useState(
    "旅行について、N4の学習者が読める400字くらいの記事を作ってください。会話練習の質問も入れてください。"
  );
  const [article, setArticle] = useState<GeneratedArticle>(initialArticle);
  const [articleHistoryItems, setArticleHistoryItems] = useState<GeneratedArticle[]>(articleHistory);
  const [savedVocabulary, setSavedVocabulary] = useState<ArticleVocabulary[]>(initialArticle.vocabulary);
  const [selectedText, setSelectedText] = useState("");
  const [actionOverlay, setActionOverlay] = useState<{ x: number; y: number; text: string } | null>(null);
  const [status, setStatus] = useState("モック生成で確認できます。");
  const [furiganaEnabled, setFuriganaEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const articleFuriganaSegments = useMemo(
    () => article.furiganaSegments.length > 0 ? article.furiganaSegments : buildFuriganaSegments(article.body),
    [article.body, article.furiganaSegments]
  );

  useEffect(() => {
    let isActive = true;

    async function loadSavedArticles() {
      setStatus("Supabaseから保存済み記事を読み込んでいます。");
      const localArticles = readLocalSavedArticles().map(mapLocalArticle);

      if (localArticles.length > 0) {
        setArticleHistoryItems(localArticles);
        setArticle(localArticles[0]);
        setSavedVocabulary(localArticles[0].vocabulary);
        setStatus("ローカル保存済み記事を読み込みました。");
      }

      const { data: articleRows, error: articleError } = await supabase
        .from("articles")
        .select("*")
        .eq("student_id", FIXED_STUDENT_ID)
        .order("updated_at", { ascending: false });

      if (!isActive) {
        return;
      }

      if (articleError || !articleRows || articleRows.length === 0) {
        setStatus(localArticles.length > 0 ? "ローカル保存済み記事を表示しています。" : "モック生成で確認できます。");
        return;
      }

      const articleIds = articleRows.map((item) => item.id);
      const { data: vocabularyRows } = await supabase
        .from("article_vocabulary_items")
        .select("*")
        .in("article_id", articleIds)
        .order("created_at", { ascending: false });

      if (!isActive) {
        return;
      }

      const vocabularyByArticle = new Map<string, ArticleVocabulary[]>();

      for (const row of vocabularyRows ?? []) {
        const currentVocabulary = vocabularyByArticle.get(row.article_id) ?? [];
        currentVocabulary.push(mapArticleVocabularyRow(row));
        vocabularyByArticle.set(row.article_id, currentVocabulary);
      }

      const savedArticles = articleRows.map((row) =>
        mapArticleRow(row, vocabularyByArticle.get(row.id) ?? [])
      );
      const mergedArticles = mergeArticles(savedArticles, localArticles);

      setArticleHistoryItems(mergedArticles);
      setArticle(mergedArticles[0]);
      setSavedVocabulary(mergedArticles[0].vocabulary);
      setStatus("Supabaseから保存済み記事を読み込みました。");
    }

    void loadSavedArticles();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFurigana() {
      const segments = await fetchFuriganaSegments(article.body, controller.signal).catch(() => null);

      if (!segments || segments.length === 0) {
        return;
      }

      setArticle((currentArticle) =>
        currentArticle.body === article.body ? { ...currentArticle, furiganaSegments: segments } : currentArticle
      );
    }

    void loadFurigana();

    return () => controller.abort();
  }, [article.body]);

  function extractTopicFromPrompt() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return selectedStudent?.interest.split("と")[0] ?? "日本の文化";
    }

    return trimmedPrompt
      .replace(/について.*/, "")
      .replace(/をテーマ.*/, "")
      .replace(/の記事.*/, "")
      .slice(0, 18);
  }

  async function handleGenerate() {
    const topic = extractTopicFromPrompt();

    setIsGenerating(true);
    setStatus("OpenAIで記事を生成しています。");

    try {
      const response = await fetch("/api/ai/generate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          level,
          tone,
          length: "400字程度",
          studentName: selectedStudent?.name ?? "学習者",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorCode = typeof errorBody?.code === "string" ? errorBody.code : "";
        throw new Error(errorCode || "generation_failed");
      }

      const generatedArticle = (await response.json()) as GeneratedArticleResponse;
      const nextArticle: GeneratedArticle = {
        id: `generated-${Date.now()}`,
        title: generatedArticle.title,
        body: generatedArticle.body,
        furiganaSegments: normalizeApiFuriganaSegments(generatedArticle.furiganaSegments, generatedArticle.body),
        level: generatedArticle.level,
        topic: generatedArticle.topic,
        tone: generatedArticle.tone,
        length: generatedArticle.length,
        createdAt: formatToday(),
        vocabulary: generatedArticle.vocabulary,
        questions: generatedArticle.questions,
        isSaved: false,
      };

      setArticle(nextArticle);
      setSavedVocabulary([]);
      setSelectedText("");
      setStatus(
        `OpenAIで記事を生成しました。語彙欄は本文から選択して手動で追加します。使用モデル: ${generatedArticle.model ?? "gpt-5.4-nano"}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setStatus(
        message === "insufficient_quota"
          ? "OpenAIの利用枠または請求設定が不足しています。Platform側のBillingを確認してください。"
          : "記事生成に失敗しました。APIキーや利用上限を確認してください。"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleArticleSelection() {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const selected = getSelectedArticleText(range);

    if (!selected || !article.body.includes(selected)) {
      return;
    }

    const rect = range?.getBoundingClientRect();

    setSelectedText(selected);
    setActionOverlay({
      x: rect && rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect && rect.height > 0 ? rect.bottom + 15 : window.innerHeight / 2,
      text: selected,
    });
  }

  async function handleAddSelectionToVocabulary() {
    if (!selectedText) {
      return;
    }

    const duplicate = savedVocabulary.some((item) => item.word === selectedText);

    if (duplicate) {
      setStatus("この語句はすでに語彙欄にあります。");
      return;
    }

    setStatus(`「${selectedText}」のよみと意味を確認しています。`);
    const selectedSentence = extractContextSentence(article.body, selectedText);
    const [reading, meaning] = await Promise.all([
      fetchVocabularyReading(selectedText).catch(() => ""),
      fetchVocabularyMeaning(selectedText, selectedSentence).catch(() => ""),
    ]);
    const articleSaveResult = article.isSaved
      ? { article, vocabulary: savedVocabulary, saved: true, error: "" }
      : await saveArticleToSupabase(article, savedVocabulary);

    if (!articleSaveResult) {
      setStatus("記事の保存に失敗したため、語彙をSupabaseに保存できませんでした。");
      return;
    }

    const savedArticle = articleSaveResult.article;

    const draftVocabulary: ArticleVocabulary = {
      word: selectedText,
      reading: reading || "よみを追加",
      meaning: meaning || "meaning to add",
      example: "",
    };

    const { data, error } = articleSaveResult.saved
      ? await supabase
          .from("article_vocabulary_items")
          .insert({
            article_id: savedArticle.id,
            example: draftVocabulary.example,
            meaning: draftVocabulary.meaning,
            reading: draftVocabulary.reading,
            word: draftVocabulary.word,
          })
          .select("*")
          .single()
      : { data: null, error: { message: articleSaveResult.error } };

    const nextVocabulary = error || !data ? draftVocabulary : mapArticleVocabularyRow(data);
    const nextArticle = {
      ...savedArticle,
      vocabulary: [nextVocabulary, ...savedArticle.vocabulary],
    };

    upsertLocalSavedArticle(toLocalSavedArticle(nextArticle, nextArticle.vocabulary));
    setArticle(nextArticle);
    setSavedVocabulary((currentItems) => [nextVocabulary, ...currentItems]);
    setArticleHistoryItems((currentItems) =>
      upsertArticleHistory(currentItems, nextArticle)
    );
    setActionOverlay(null);
    setStatus(
      error
        ? `「${selectedText}」をローカル語彙欄に追加しました。Supabase保存は失敗しました: ${error.message}`
        : `「${selectedText}」をSupabaseの語彙欄に追加しました。`
    );
  }

  function handleTranslateSelection() {
    if (!selectedText) {
      return;
    }

    setActionOverlay(null);
    setStatus(`翻訳メモ: 「${selectedText}」を確認中です。`);
  }

  function handlePickArticle(nextArticle: GeneratedArticle) {
    setArticle(nextArticle);
    setSavedVocabulary(nextArticle.vocabulary);
    setSelectedText("");
    setStatus("保存済み記事を表示しました。");
  }

  function handleUpdateVocabularyExample(targetItem: ArticleVocabulary, example: string) {
    setSavedVocabulary((currentItems) =>
      currentItems.map((item) => (isSameVocabularyItem(item, targetItem) ? { ...item, example } : item))
    );
    setArticle((currentArticle) => {
      const nextVocabulary = currentArticle.vocabulary.map((item) =>
        isSameVocabularyItem(item, targetItem) ? { ...item, example } : item
      );
      const nextArticle = { ...currentArticle, vocabulary: nextVocabulary };

      upsertLocalSavedArticle(toLocalSavedArticle(nextArticle, nextVocabulary));

      return nextArticle;
    });
    setArticleHistoryItems((currentItems) =>
      currentItems.map((historyItem) => {
        if (historyItem.id !== article.id) {
          return historyItem;
        }

        return {
          ...historyItem,
          vocabulary: historyItem.vocabulary.map((item) =>
            isSameVocabularyItem(item, targetItem) ? { ...item, example } : item
          ),
        };
      })
    );
  }

  async function handleSaveVocabularyExample(targetItem: ArticleVocabulary) {
    if (!targetItem.id) {
      return;
    }

    const { error } = await supabase
      .from("article_vocabulary_items")
      .update({ example: targetItem.example })
      .eq("id", targetItem.id);

    if (error) {
      setStatus(`例文メモのSupabase保存に失敗しました: ${error.message}`);
      return;
    }

    setStatus("例文メモを保存しました。");
  }

  function handleNewArticle() {
    const nextArticle: GeneratedArticle = {
      ...initialArticle,
      id: `draft-${Date.now()}`,
      title: "新しい記事",
      body: "ここに生成された記事が表示されます。",
      furiganaSegments: buildFuriganaSegments("ここに生成された記事が表示されます。"),
      level,
      topic: extractTopicFromPrompt() || "未設定",
      tone,
      length: "未生成",
      createdAt: formatToday(),
      vocabulary: [],
      questions: [],
      isSaved: false,
    };

    setArticle(nextArticle);
    setSavedVocabulary([]);
    setSelectedText("");
    setActionOverlay(null);
    setStatus("新しい記事を作成できます。プロンプトを入力してOpenAIで生成してください。");
  }

  async function handleSaveArticle() {
    const result = await saveArticleToSupabase(article, savedVocabulary);

    upsertLocalSavedArticle(toLocalSavedArticle(result.article, result.vocabulary));
    setArticle(result.article);
    setSavedVocabulary(result.vocabulary);
    setArticleHistoryItems((currentItems) =>
      upsertArticleHistory(currentItems, { ...result.article, vocabulary: result.vocabulary })
    );
    setStatus(
      result.saved
        ? "記事をSupabaseに保存しました。左の保存した記事一覧にも反映しました。"
        : `左の保存した記事一覧には反映しました。Supabase保存は失敗しました: ${result.error}`
    );
  }

  async function saveArticleToSupabase(targetArticle: GeneratedArticle, targetVocabulary: ArticleVocabulary[]) {
    setIsSaving(true);
    setStatus("記事をSupabaseに保存しています。");

    const articlePayload = {
      body: targetArticle.body,
      created_by: null,
      level: targetArticle.level,
      student_id: FIXED_STUDENT_ID,
      title: targetArticle.title || "無題の記事",
      topic: targetArticle.topic || "未設定",
      updated_at: new Date().toISOString(),
    };

    const articleResult = targetArticle.isSaved
      ? await supabase
          .from("articles")
          .update(articlePayload)
          .eq("id", targetArticle.id)
          .select("*")
          .single()
      : await supabase
          .from("articles")
          .insert(articlePayload)
          .select("*")
          .single();

    if (articleResult.error || !articleResult.data) {
      setIsSaving(false);
      return {
        article: createLocalSavedArticle(targetArticle, targetVocabulary),
        vocabulary: targetVocabulary,
        saved: false,
        error: articleResult.error?.message ?? "unknown error",
      };
    }

    const savedArticle = mapArticleRow(articleResult.data, targetVocabulary);
    const unsavedVocabulary = targetVocabulary.filter((item) => !item.id);
    let nextVocabulary = targetVocabulary;

    if (unsavedVocabulary.length > 0) {
      const { data: vocabularyRows } = await supabase
        .from("article_vocabulary_items")
        .insert(
          unsavedVocabulary.map((item) => ({
            article_id: savedArticle.id,
            example: item.example,
            meaning: item.meaning,
            reading: item.reading,
            word: item.word,
          }))
        )
        .select("*");

      if (vocabularyRows) {
        const savedVocabularyRows = vocabularyRows.map(mapArticleVocabularyRow);
        nextVocabulary = [
          ...targetVocabulary.filter((item) => item.id),
          ...savedVocabularyRows,
        ];
      }
    }

    const nextArticle = {
      ...savedArticle,
      furiganaSegments: targetArticle.furiganaSegments,
      tone: targetArticle.tone,
      length: targetArticle.length,
      questions: targetArticle.questions,
      vocabulary: nextVocabulary,
    };

    setIsSaving(false);

    return { article: nextArticle, vocabulary: nextVocabulary, saved: true, error: "" };
  }

  return (
    <section className="grid min-h-[calc(100vh-12rem)] gap-5 xl:grid-cols-[350px_minmax(0,1fr)_380px]" id="overview">
      <aside className="min-h-[calc(100vh-12rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-5 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#DDF4FA] text-lg font-black text-[#2F88C5]">
              記
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">Articles</p>
              <h2 className="truncate text-xl font-black text-[#10233B]">
                {role === "teacher" ? "保存した記事" : "読む記事"}
              </h2>
            </div>
          </div>
          <button
            aria-label="新しい記事を作成"
            className="grid h-10 w-10 flex-none place-items-center rounded-2xl border border-[#CDEBF5] bg-[#F7FCFF] text-2xl font-black leading-none text-[#2F88C5] transition hover:bg-[#DDF4FA]"
            onClick={handleNewArticle}
            title="新しい記事を作成"
            type="button"
          >
            +
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {articleHistoryItems.map((historyItem) => {
            const isActive = historyItem.id === article.id;

            return (
              <button
                key={historyItem.id}
                className={[
                  "rounded-[22px] border px-4 py-3 text-left transition",
                  isActive
                    ? "border-[#5DB6DE] bg-[#EAF7FF] shadow-[0_10px_24px_rgba(47,136,197,0.12)]"
                    : "border-[#DDEAF1] bg-[#F7FCFF] hover:border-[#A9DFF0]",
                ].join(" ")}
                onClick={() => handlePickArticle(historyItem)}
                type="button"
              >
                <p className="text-base font-black text-[#10233B]">{historyItem.title}</p>
                <p className="mt-2 text-xs font-bold text-[#6F7F8A]">
                  {historyItem.createdAt} ・ {historyItem.level}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="min-h-[calc(100vh-12rem)] min-w-0 rounded-[34px] border border-[#DDEAF1] bg-white p-6 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="grid gap-2 text-sm font-black text-[#10233B]">
            記事生成プロンプト
            <textarea
              className="h-[72px] w-full resize-none rounded-[24px] border border-[#D6E4EA] bg-[#F7FCFF] px-5 py-3 text-sm font-bold leading-6 text-[#10233B] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="例: 旅行について、N4の学習者が読める400字くらいの記事を作ってください。"
              value={prompt}
            />
          </label>

          <div className="grid content-start gap-3">
            <div>
              <p className="text-sm font-black text-[#10233B]">JLPTレベル</p>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {levelOptions.map((option) => (
                  <button
                    key={option}
                    className={[
                      "min-h-10 rounded-xl border text-xs font-black transition",
                      level === option
                        ? "border-[#5DB6DE] bg-[#DDF4FA] text-[#2F88C5]"
                        : "border-[#DDEAF1] bg-white text-[#6F7F8A]",
                    ].join(" ")}
                    onClick={() => setLevel(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-black text-[#10233B]">文体</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {toneOptions.map((option) => (
                  <button
                    key={option}
                    className={[
                      "min-h-10 rounded-xl border px-2 text-xs font-black transition",
                      tone === option
                        ? "border-[#F7B7AD] bg-[#FFE7E3] text-[#D36F65]"
                        : "border-[#DDEAF1] bg-white text-[#6F7F8A]",
                    ].join(" ")}
                    onClick={() => setTone(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.2)] disabled:opacity-60"
              disabled={isGenerating}
              onClick={handleGenerate}
              type="button"
            >
              {isGenerating ? "生成中..." : "OpenAIで生成"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-y border-[#E3EEF5] py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">
              {article.level} ・ {article.topic} ・ {article.tone}
            </p>
            <h1 className="mt-1 text-3xl font-black text-[#10233B]">{article.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[#DDEAF1] bg-[#F7FCFF] p-1">
              <span className="px-3 text-sm font-black text-[#2F88C5]">ふりがな</span>
              <button
                className={[
                  "min-h-9 rounded-full px-4 text-sm font-black transition",
                  furiganaEnabled ? "bg-white text-[#2F88C5] shadow-sm" : "text-[#6F7F8A]",
                ].join(" ")}
                onClick={() => setFuriganaEnabled(true)}
                type="button"
              >
                あり
              </button>
              <button
                className={[
                  "min-h-9 rounded-full px-4 text-sm font-black transition",
                  !furiganaEnabled ? "bg-white text-[#2F88C5] shadow-sm" : "text-[#6F7F8A]",
                ].join(" ")}
                onClick={() => setFuriganaEnabled(false)}
                type="button"
              >
                なし
              </button>
            </div>
            <span className="rounded-full bg-[#DDF4FA] px-4 py-2 text-sm font-black text-[#2F88C5]">
              {article.length}
            </span>
            <button
              className="rounded-full border border-[#CDEBF5] bg-[#F7FCFF] px-4 py-2 text-sm font-black text-[#2F88C5] transition hover:bg-[#DDF4FA] disabled:opacity-60"
              disabled={isSaving}
              onClick={handleSaveArticle}
              type="button"
            >
              {isSaving ? "保存中..." : article.isSaved ? "保存済みを更新" : "記事を保存"}
            </button>
          </div>
        </div>

        <article
          className="mt-5 min-h-[42vh] rounded-[28px] border border-[#DDEAF1] bg-[#FBFEFF] px-7 py-7"
          onBlur={() => window.setTimeout(() => setActionOverlay(null), 180)}
          onMouseUp={() => window.setTimeout(handleArticleSelection, 0)}
          onTouchEnd={() => window.setTimeout(handleArticleSelection, 0)}
        >
          <p className="whitespace-pre-wrap text-lg font-bold leading-9 text-[#10233B]">
            <RubyText segments={articleFuriganaSegments} showFurigana={furiganaEnabled} />
          </p>
        </article>

        {role === "teacher" ? (
          <section className="mt-5 rounded-[26px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#10233B]">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#FFE7E3] text-[#D36F65]">
                Q
              </span>
              会話練習の質問
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {article.questions.map((question, index) => (
                <div key={question} className="rounded-[20px] bg-white px-4 py-3">
                  <p className="text-xs font-black text-[#2F88C5]">Question {index + 1}</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#2F3337]">{question}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-4 text-sm font-bold text-[#6F7F8A]">{status}</p>
      </main>

      {actionOverlay ? (
        <ArticleActionOverlay
          selectedText={actionOverlay.text}
          x={actionOverlay.x}
          y={actionOverlay.y}
          onAddVocabulary={handleAddSelectionToVocabulary}
          onTranslate={handleTranslateSelection}
        />
      ) : null}

      <aside className="min-h-[calc(100vh-12rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-5 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#DDF4FA] text-lg font-black text-[#2F88C5]">
            語
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">Memory bank</p>
            <h2 className="text-xl font-black text-[#10233B]">記事の語彙欄</h2>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-dashed border-[#BCD9EA] bg-[#F7FCFF] p-4">
          <p className="text-xs font-black text-[#2F88C5]">追加方法</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#6F7F8A]">
            記事本文の語句を選択すると、本文の下にアクションポップが表示されます。
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {savedVocabulary.map((item, index) => (
            <article key={item.id ?? `${item.word}-${index}`} className="rounded-[22px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
              <p className="font-black text-[#10233B]">
                {item.word}
                <span className="ml-2 text-sm text-[#2F88C5]">{item.reading}</span>
              </p>
              <p className="mt-1 text-sm font-bold text-[#6F7F8A]">{item.meaning}</p>
              <textarea
                className="mt-3 min-h-20 w-full resize-none rounded-[18px] border border-[#D6E4EA] bg-white px-3 py-3 text-sm font-bold leading-6 text-[#2F3337] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
                onBlur={() => void handleSaveVocabularyExample(item)}
                onChange={(event) => handleUpdateVocabularyExample(item, event.target.value)}
                placeholder="例文やメモを入力"
                value={item.example}
              />
            </article>
          ))}
        </div>
      </aside>
    </section>
  );
}

function RubyText({
  segments,
  showFurigana,
}: {
  segments: ReturnType<typeof buildFuriganaSegments>;
  showFurigana: boolean;
}) {
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "newline") {
          return <br key={`line-${index}`} />;
        }

        if (segment.type === "ruby") {
          return showFurigana ? (
            <ruby key={`ruby-${index}`} className="workspace-ruby">
              {segment.text}
              <rt>{segment.reading}</rt>
            </ruby>
          ) : (
            <span key={`text-${index}`}>{segment.text}</span>
          );
        }

        return <span key={`plain-${index}`}>{segment.text}</span>;
      })}
    </>
  );
}

function ArticleActionOverlay({
  selectedText,
  x,
  y,
  onAddVocabulary,
  onTranslate,
}: {
  selectedText: string;
  x: number;
  y: number;
  onAddVocabulary: () => void;
  onTranslate: () => void;
}) {
  const actions = [
    { label: "翻訳", onClick: onTranslate },
    { label: "語彙追加", onClick: onAddVocabulary },
  ];

  return (
    <div
      className="fixed z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-[22px] border border-[#CFE4F2] bg-white/95 px-3 py-2 shadow-[0_18px_46px_rgba(47,136,197,0.22)] backdrop-blur"
      onMouseDown={(event) => event.preventDefault()}
      style={{
        left: Math.min(Math.max(x, 96), window.innerWidth - 96),
        top: Math.min(Math.max(y, 72), window.innerHeight - 72),
      }}
    >
      <div className="mb-2 max-w-60 truncate px-2 text-xs font-black text-[#6F7F8A]">
        {selectedText}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            className="min-h-10 rounded-full bg-[#EEF8FF] px-4 text-sm font-black text-[#2F88C5] transition hover:bg-[#DDF4FA]"
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function getSelectedArticleText(range: Range | null) {
  if (!range) {
    return "";
  }

  const fragment = range.cloneContents();
  fragment.querySelectorAll("rt").forEach((node) => node.remove());

  return (fragment.textContent ?? "").trim();
}

function extractContextSentence(text: string, selectedText: string) {
  const start = text.indexOf(selectedText);

  if (start < 0) {
    return "";
  }

  const beforeText = text.slice(0, start);
  const sentenceStart = Math.max(
    beforeText.lastIndexOf("。"),
    beforeText.lastIndexOf("！"),
    beforeText.lastIndexOf("？"),
    beforeText.lastIndexOf("\n")
  );
  const afterText = text.slice(start + selectedText.length);
  const sentenceEndOffset = afterText.search(/[。！？\n]/);
  const sentenceEnd =
    sentenceEndOffset >= 0 ? start + selectedText.length + sentenceEndOffset + 1 : text.length;

  return text.slice(sentenceStart + 1, sentenceEnd).trim();
}

function mapArticleRow(row: ArticleRow, vocabulary: ArticleVocabulary[] = []): GeneratedArticle {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    furiganaSegments: [],
    level: normalizeLevel(row.level),
    topic: row.topic,
    tone: "自然",
    length: `${row.body.length}字`,
    createdAt: formatDisplayDate(row.created_at),
    vocabulary,
    questions: [],
    isSaved: true,
  };
}

function mapArticleVocabularyRow(row: ArticleVocabularyRow): ArticleVocabulary {
  return {
    id: row.id,
    word: row.word,
    reading: row.reading ?? "",
    meaning: row.meaning ?? "",
    example: row.example ?? "",
  };
}

function isSameVocabularyItem(left: ArticleVocabulary, right: ArticleVocabulary) {
  if (left.id || right.id) {
    return left.id === right.id;
  }

  return left.word === right.word && left.reading === right.reading;
}

function mapLocalArticle(article: LocalSavedArticle): GeneratedArticle {
  return {
    id: article.id,
    title: article.title,
    body: article.body,
    furiganaSegments: article.furiganaSegments,
    level: normalizeLevel(article.level),
    topic: article.topic,
    tone: normalizeTone(article.tone),
    length: article.length,
    createdAt: article.createdAt,
    vocabulary: article.vocabulary,
    questions: article.questions,
    isSaved: article.isSaved,
  };
}

function toLocalSavedArticle(
  article: GeneratedArticle,
  vocabulary: ArticleVocabulary[]
): LocalSavedArticle {
  return {
    id: article.id,
    title: article.title,
    body: article.body,
    furiganaSegments: article.furiganaSegments,
    level: article.level,
    topic: article.topic,
    tone: article.tone,
    length: article.length,
    createdAt: article.createdAt,
    vocabulary,
    questions: article.questions,
    isSaved: article.isSaved,
  };
}

function createLocalSavedArticle(
  article: GeneratedArticle,
  vocabulary: ArticleVocabulary[]
): GeneratedArticle {
  return {
    ...article,
    id: article.id || `local-article-${Date.now()}`,
    vocabulary,
    isSaved: false,
  };
}

function mergeArticles(primaryArticles: GeneratedArticle[], fallbackArticles: GeneratedArticle[]) {
  const articleMap = new Map<string, GeneratedArticle>();

  for (const article of [...fallbackArticles, ...primaryArticles]) {
    articleMap.set(article.id, article);
  }

  return [...articleMap.values()];
}

function upsertArticleHistory(items: GeneratedArticle[], nextArticle: GeneratedArticle) {
  const otherItems = items.filter((item) => item.id !== nextArticle.id);

  return [nextArticle, ...otherItems];
}

function normalizeLevel(level: string): Student["level"] {
  return levelOptions.includes(level as Student["level"]) ? (level as Student["level"]) : "N4";
}

function normalizeTone(tone: string): Tone {
  return toneOptions.includes(tone as Tone) ? (tone as Tone) : "自然";
}

function formatDisplayDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function normalizeApiFuriganaSegments(
  apiSegments: ApiFuriganaSegment[] | undefined,
  fallbackText: string
): FuriganaSegment[] {
  if (!apiSegments || apiSegments.length === 0) {
    return buildFuriganaSegments(fallbackText);
  }

  const segments = apiSegments
    .map((segment): FuriganaSegment | null => {
      if (segment.type === "newline") {
        return { type: "newline" };
      }

      const text = segment.text.trim();

      if (!text) {
        return null;
      }

      if (segment.type === "ruby") {
        const reading = normalizeReading(segment.reading);

        if (!reading) {
          return { type: "text", text };
        }

        return { type: "ruby", text, reading };
      }

      return { type: "text", text: segment.text };
    })
    .filter((segment): segment is FuriganaSegment => segment !== null);

  return segments.length > 0 ? segments : buildFuriganaSegments(fallbackText);
}

function normalizeReading(reading: string) {
  return reading
    .trim()
    .replace(/[\u30a1-\u30f3]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[\u3400-\u9fff]/g, "");
}
