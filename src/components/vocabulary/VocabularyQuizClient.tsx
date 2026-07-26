"use client";

import { useEffect, useMemo, useState } from "react";
import { articles, vocabulary, writings } from "@/lib/mock-data";
import { readLocalSavedArticles, updateLocalArticleVocabularyExample } from "@/lib/local-article-store";
import { FIXED_STUDENT_ID } from "@/lib/supabase/constants";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { fetchVocabularyJudgement } from "@/lib/vocabulary-judge-client";
import type { Role, Student, WorkspaceVocabularyItem, Writing } from "@/lib/types";

type SourceType = "writing" | "article";
type MainTab = "ai" | "wordbook";
type WordbookStage = "prepare" | "test" | "result";
type WordbookTestStep = "meaning" | "sentence";
type JudgeTone = "correct" | "close" | "incorrect";

type QuizSource = {
  id: string;
  type: SourceType;
  title: string;
  date: string;
  description: string;
};

type QuizWord = {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
  sourceId: string;
  sourceType: SourceType;
  storageTable?: "article_vocabulary_items" | "local_article" | "local_workspace" | "vocabulary_items";
  judgeLabel?: string;
  judgeMessage?: string;
  learnerSentence?: string;
  lastCheck?: JudgeTone;
  meaningAnswer?: string;
};

type AiQuestion = {
  id: string;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type JudgeResult = {
  label: string;
  tone: JudgeTone;
  message: string;
};

type StoredWorkspaceState = {
  writings?: Writing[];
  vocabulary?: WorkspaceVocabularyItem[];
};

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ArticleVocabularyRow = Database["public"]["Tables"]["article_vocabulary_items"]["Row"];
type VocabularyRow = Database["public"]["Tables"]["vocabulary_items"]["Row"];
type WritingRow = Database["public"]["Tables"]["writings"]["Row"];

const levelOptions: Student["level"][] = ["N5", "N4", "N3", "N2", "N1"];
const WORKSPACE_STORAGE_KEY = "nihongo-palette-phase2-workspace";

const initialSources: QuizSource[] = [
  ...writings.map((writing) => ({
    id: writing.id,
    type: "writing" as const,
    title: writing.title,
    date: writing.updatedAt.replaceAll("-", "/"),
    description: writing.draft,
  })),
  ...articles.map((article) => ({
    id: article.id,
    type: "article" as const,
    title: article.title,
    date: "2026/05/11",
    description: `${article.level} ・ ${article.topic}`,
  })),
];

const initialWords: QuizWord[] = [
  ...vocabulary.map((item) => ({
    id: item.id,
    word: item.word,
    reading: item.reading,
    meaning: item.meaning,
    example: item.example,
    sourceId: item.studentId === "student-1" ? "writing-1" : "writing-2",
    sourceType: "writing" as const,
  })),
  {
    id: "article-vocab-1",
    word: "静か",
    reading: "しずか",
    meaning: "quiet",
    example: "お寺の庭は静かでした。",
    sourceId: "article-1",
    sourceType: "article",
  },
  {
    id: "article-vocab-2",
    word: "おみやげ",
    reading: "おみやげ",
    meaning: "souvenir",
    example: "帰る前におみやげを買いました。",
    sourceId: "article-1",
    sourceType: "article",
  },
  {
    id: "article-vocab-3",
    word: "表現",
    reading: "ひょうげん",
    meaning: "expression",
    example: "新しい表現を覚えます。",
    sourceId: "article-2",
    sourceType: "article",
  },
];

function sourceBadgeLabel(type: SourceType) {
  return type === "writing" ? "自分の作文" : "AI記事";
}

function judgeMeaning(answer: string, word: QuizWord): JudgeResult {
  const normalizedAnswer = answer.trim().toLowerCase();
  const normalizedMeaning = word.meaning.toLowerCase();

  if (isBroadMeaningAnswer(normalizedAnswer) && normalizedMeaning !== normalizedAnswer) {
    return {
      label: "おしい",
      tone: "close",
      message:
        "方向は近いですが、辞書的な意味としては少し広すぎます。もう少し具体的に答えましょう。",
    };
  }

  if (normalizedAnswer === normalizedMeaning || normalizedAnswer.includes(normalizedMeaning)) {
    return {
      label: "正解",
      tone: "correct",
      message: "意味がしっかり通じています。文の中でも使ってみましょう。",
    };
  }

  if (normalizedMeaning.includes(normalizedAnswer) || normalizedAnswer.length >= 4) {
    return {
      label: "おしい",
      tone: "close",
      message: "方向は近いです。もう少し具体的に説明できると、より自然です。",
    };
  }

  return {
    label: "不正解",
    tone: "incorrect",
    message: "意味をもう一度確認しましょう。例文を読んで、使われ方を見るのがおすすめです。",
  };
}

function isBroadMeaningAnswer(answer: string) {
  return [
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
  ].includes(answer.replace(/[.,!?;:'"()[\]{}、。！？「」『』（）]/g, ""));
}

function judgeLabelWithIcon(result: JudgeResult) {
  if (result.tone === "correct") {
    return `🎯 ${result.label}`;
  }

  if (result.tone === "close") {
    return `💡 ${result.label}`;
  }

  return `🔁 ${result.label}`;
}

function mapWritingSource(row: WritingRow): QuizSource {
  return {
    id: row.id,
    type: "writing",
    title: row.title,
    date: formatDisplayDate(row.updated_at),
    description: row.draft,
  };
}

function mapArticleSource(row: ArticleRow): QuizSource {
  return {
    id: row.id,
    type: "article",
    title: row.title,
    date: formatDisplayDate(row.updated_at),
    description: `${row.level} ・ ${row.topic}`,
  };
}

function mapWritingVocabularyRow(row: VocabularyRow): QuizWord {
  return {
    id: row.id,
    word: row.word,
    reading: row.reading ?? "",
    meaning: row.meaning ?? "",
    example: row.example ?? "",
    sourceId: row.writing_id ?? row.article_id ?? "unknown-source",
    sourceType: row.article_id ? "article" : "writing",
    storageTable: "vocabulary_items",
  };
}

function mapArticleVocabularyRow(row: ArticleVocabularyRow): QuizWord {
  return {
    id: row.id,
    word: row.word,
    reading: row.reading ?? "",
    meaning: row.meaning ?? "",
    example: row.example ?? "",
    sourceId: row.article_id,
    sourceType: "article",
    storageTable: "article_vocabulary_items",
  };
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

function mergeQuizSources(primarySources: QuizSource[], fallbackSources: QuizSource[]) {
  const sourceMap = new Map<string, QuizSource>();

  for (const source of [...fallbackSources, ...primarySources]) {
    sourceMap.set(source.id, source);
  }

  return [...sourceMap.values()];
}

function mergeQuizWords(primaryWords: QuizWord[], fallbackWords: QuizWord[]) {
  const wordMap = new Map<string, QuizWord>();

  for (const word of [...fallbackWords, ...primaryWords]) {
    wordMap.set(word.id, word);
  }

  return [...wordMap.values()];
}

function readLocalWorkspaceState(): StoredWorkspaceState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const savedValue = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

    if (!savedValue) {
      return {};
    }

    const parsedValue = JSON.parse(savedValue) as StoredWorkspaceState;

    return {
      vocabulary: Array.isArray(parsedValue.vocabulary) ? parsedValue.vocabulary : [],
      writings: Array.isArray(parsedValue.writings) ? parsedValue.writings : [],
    };
  } catch {
    return {};
  }
}

function writeLocalWorkspaceState(state: StoredWorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("nihongo-palette-workspace-updated"));
}

function updateLocalWorkspaceVocabularyExample({
  example,
  vocabularyId,
}: {
  example: string;
  vocabularyId: string;
}) {
  const localWorkspace = readLocalWorkspaceState();
  const localVocabulary = localWorkspace.vocabulary ?? [];
  let didUpdate = false;
  const nextVocabulary = localVocabulary.map((item) => {
    if (item.id !== vocabularyId) {
      return item;
    }

    didUpdate = true;
    return { ...item, example, sourceSentence: "" };
  });

  if (!didUpdate) {
    return false;
  }

  writeLocalWorkspaceState({ ...localWorkspace, vocabulary: nextVocabulary });
  return true;
}

function buildLocalWorkspaceWordbookData() {
  const localWorkspace = readLocalWorkspaceState();
  const localWritings = localWorkspace.writings ?? [];
  const localVocabulary = (localWorkspace.vocabulary ?? []).filter((item) => item.writingId);
  const writingIdsWithWords = new Set(localVocabulary.map((item) => item.writingId));

  const localWorkspaceSources = localWritings
    .filter((writing) => writingIdsWithWords.has(writing.id))
    .map((writing): QuizSource => ({
      id: writing.id,
      type: "writing",
      title: writing.title || "無題の作文",
      date: writing.updatedAt.replaceAll("-", "/"),
      description: writing.draft,
    }));

  const localWorkspaceWords = localVocabulary.map((item): QuizWord => ({
    id: item.id,
    word: item.word,
    reading: item.reading,
    meaning: item.meaning,
    example: item.example,
    sourceId: item.writingId ?? "unknown-source",
    sourceType: "writing",
    storageTable: "local_workspace",
  }));

  return { localWorkspaceSources, localWorkspaceWords };
}

export function VocabularyQuizClient({ role }: { role: Role }) {
  const [activeTab, setActiveTab] = useState<MainTab>("ai");
  const [aiTopic, setAiTopic] = useState("旅行");
  const [aiLevel, setAiLevel] = useState<Student["level"]>("N4");
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiChecked, setAiChecked] = useState(false);

  const [sources, setSources] = useState<QuizSource[]>(initialSources);
  const [words, setWords] = useState(initialWords);
  const [expandedSourceIds, setExpandedSourceIds] = useState<string[]>([initialSources[0]?.id ?? ""]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([initialSources[0]?.id ?? ""]);
  const [stage, setStage] = useState<WordbookStage>("prepare");
  const [testStep, setTestStep] = useState<WordbookTestStep>("meaning");
  const [testWords, setTestWords] = useState<QuizWord[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [meaningAnswer, setMeaningAnswer] = useState("");
  const [sentenceDraft, setSentenceDraft] = useState("");
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [isJudging, setIsJudging] = useState(false);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("学習目的に合わせてタブを選べます。");

  const totalSelectedWords = useMemo(
    () => words.filter((word) => selectedSourceIds.includes(word.sourceId)).length,
    [selectedSourceIds, words]
  );
  const currentWord = testWords[wordIndex];
  const progressPercent = testWords.length > 0 ? ((wordIndex + 1) / testWords.length) * 100 : 0;

  useEffect(() => {
    let isActive = true;

    async function loadWordbookData() {
      setStatus("Supabaseから作文・記事・語彙を読み込んでいます。");
      const localArticles = readLocalSavedArticles();
      const localArticleSources = localArticles
        .filter((article) => article.vocabulary.length > 0)
        .map((article): QuizSource => ({
          id: article.id,
          type: "article",
          title: article.title,
          date: article.createdAt,
          description: `${article.level} ・ ${article.topic}`,
        }));
      const localArticleWords = localArticles.flatMap((article) =>
        article.vocabulary.map((item, index): QuizWord => ({
          id: item.id ?? `${article.id}-local-vocab-${index}`,
          word: item.word,
          reading: item.reading,
          meaning: item.meaning,
          example: item.example,
          sourceId: article.id,
          sourceType: "article",
          storageTable: "local_article",
        }))
      );
      const { localWorkspaceSources, localWorkspaceWords } = buildLocalWorkspaceWordbookData();
      const localSources = mergeQuizSources(localArticleSources, localWorkspaceSources);
      const localWords = mergeQuizWords(localArticleWords, localWorkspaceWords);

      if (localSources.length > 0 || localWords.length > 0) {
        const firstSourceId = localSources[0]?.id ?? "";
        setSources((currentSources) => mergeQuizSources(currentSources, localSources));
        setWords((currentWords) => mergeQuizWords(currentWords, localWords));
        setExpandedSourceIds(firstSourceId ? [firstSourceId] : []);
        setSelectedSourceIds(firstSourceId ? [firstSourceId] : []);
        setStatus("保存済み作文・記事の語彙を単語帳テストに反映しました。");
      }

      const [writingsResult, writingVocabularyResult, articlesResult] = await Promise.all([
        supabase
          .from("writings")
          .select("*")
          .eq("student_id", FIXED_STUDENT_ID)
          .order("updated_at", { ascending: false }),
        supabase
          .from("vocabulary_items")
          .select("*")
          .eq("student_id", FIXED_STUDENT_ID)
          .order("created_at", { ascending: false }),
        supabase
          .from("articles")
          .select("*")
          .eq("student_id", FIXED_STUDENT_ID)
          .order("updated_at", { ascending: false }),
      ]);

      if (!isActive) {
        return;
      }

      if (writingsResult.error && articlesResult.error) {
        setStatus(
          localWords.length > 0
            ? "ローカル保存済み作文・記事の語彙を表示しています。Supabase読み込みは失敗しました。"
            : "Supabase読み込みに失敗しました。モックデータで確認できます。"
        );
        return;
      }

      const articleRows = articlesResult.data ?? [];
      const articleIds = articleRows.map((article) => article.id);
      const articleVocabularyResult =
        articleIds.length > 0
          ? await supabase
              .from("article_vocabulary_items")
              .select("*")
              .in("article_id", articleIds)
              .order("created_at", { ascending: false })
          : { data: [] as ArticleVocabularyRow[], error: null };

      if (!isActive) {
        return;
      }

      const dbSources = [
        ...(writingsResult.data ?? []).map(mapWritingSource),
        ...articleRows.map(mapArticleSource),
      ];
      const dbWords = [
        ...(writingVocabularyResult.data ?? []).map(mapWritingVocabularyRow),
        ...(articleVocabularyResult.data ?? []).map(mapArticleVocabularyRow),
      ];
      const mergedWords = mergeQuizWords(dbWords, localWords);
      const mergedSources = mergeQuizSources(dbSources, localSources);

      if (mergedSources.length === 0 && mergedWords.length === 0) {
        setStatus("Supabaseに語彙データがまだありません。モックデータで確認できます。");
        return;
      }

      const sourceIdsWithWords = new Set(mergedWords.map((word) => word.sourceId));
      const nextSources = mergedSources.filter((source) => sourceIdsWithWords.has(source.id));
      const firstSourceId = nextSources[0]?.id ?? "";

      setSources(nextSources);
      setWords(mergedWords);
      setExpandedSourceIds(firstSourceId ? [firstSourceId] : []);
      setSelectedSourceIds(firstSourceId ? [firstSourceId] : []);
      setStatus("Supabaseの作文・AI記事語彙を単語帳テストに反映しました。");
    }

    void loadWordbookData();

    return () => {
      isActive = false;
    };
  }, []);

  function handleGenerateAiQuiz() {
    const topic = aiTopic.trim() || "日本の文化";
    const generatedQuestions: AiQuestion[] = [
      {
        id: "ai-q-1",
        question: `${topic}について話すとき、いちばん自然な表現はどれですか。`,
        choices: [`${topic}に興味があります`, `${topic}を寝ます`, `${topic}が青いです`, `${topic}へ飲みます`],
        answer: `${topic}に興味があります`,
        explanation: "「興味があります」は、トピックについて関心があるときに使いやすい表現です。",
      },
      {
        id: "ai-q-2",
        question: `${aiLevel}の読解で大切なことはどれですか。`,
        choices: ["文の流れを読む", "全部の漢字を飛ばす", "助詞を見ない", "語尾だけ読む"],
        answer: "文の流れを読む",
        explanation: "知らない単語があっても、前後の文から意味を考えることが大切です。",
      },
      {
        id: "ai-q-3",
        question: `会話で「${topic}はどうでしたか」と聞かれたら、どの答えが自然ですか。`,
        choices: ["とても楽しかったです", "昨日は机です", "駅を食べました", "静かを行きます"],
        answer: "とても楽しかったです",
        explanation: "感想を聞かれたときは、「楽しかったです」「おもしろかったです」のように答えます。",
      },
    ];

    setAiQuestions(generatedQuestions);
    setAiAnswers({});
    setAiChecked(false);
    setStatus("OpenAI生成モックで4択問題を3問作成しました。");
  }

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((currentIds) =>
      currentIds.includes(sourceId)
        ? currentIds.filter((id) => id !== sourceId)
        : [...currentIds, sourceId]
    );
  }

  function toggleExpanded(sourceId: string) {
    setExpandedSourceIds((currentIds) =>
      currentIds.includes(sourceId)
        ? currentIds.filter((id) => id !== sourceId)
        : [...currentIds, sourceId]
    );
  }

  function handleStartWordbookTest() {
    const nextTestWords = words.filter((word) => selectedSourceIds.includes(word.sourceId));

    setTestWords(nextTestWords);
    setWordIndex(0);
    setMeaningAnswer("");
    setSentenceDraft("");
    setJudgeResult(null);
    setSavedSessionId(null);
    setTestStep("meaning");
    setStage("test");
    setStatus("単語帳テストを開始しました。");
  }

  async function handleJudgeWord() {
    if (!currentWord || !meaningAnswer.trim()) {
      return;
    }

    setIsJudging(true);
    setStatus("OpenAIで意味を判定しています。");

    const result = await fetchVocabularyJudgement({
      answer: meaningAnswer,
      example: currentWord.example,
      meaning: currentWord.meaning,
      reading: currentWord.reading,
      word: currentWord.word,
    }).catch(() => judgeMeaning(meaningAnswer, currentWord));

    setJudgeResult(result);
    setWords((currentWords) =>
      currentWords.map((word) =>
        word.id === currentWord.id
          ? {
              ...word,
              judgeLabel: result.label,
              judgeMessage: result.message,
              lastCheck: result.tone,
              meaningAnswer: meaningAnswer.trim(),
            }
          : word
      )
    );
    setTestWords((currentWords) =>
      currentWords.map((word) =>
        word.id === currentWord.id
          ? {
              ...word,
              judgeLabel: result.label,
              judgeMessage: result.message,
              lastCheck: result.tone,
              meaningAnswer: meaningAnswer.trim(),
            }
          : word
      )
    );
    setIsJudging(false);
    setStatus("OpenAIで意味を判定しました。次に例文作成へ進めます。");
  }

  async function handleSaveSentence() {
    if (!currentWord || !sentenceDraft.trim()) {
      return;
    }

    const sentence = sentenceDraft.trim();

    setWords((currentWords) =>
      currentWords.map((word) =>
        word.id === currentWord.id ? { ...word, example: sentence, learnerSentence: sentence } : word
      )
    );
    setTestWords((currentWords) =>
      currentWords.map((word) =>
        word.id === currentWord.id ? { ...word, example: sentence, learnerSentence: sentence } : word
      )
    );

    if (currentWord.storageTable === "local_article") {
      updateLocalArticleVocabularyExample({
        articleId: currentWord.sourceId,
        example: sentence,
        vocabularyId: currentWord.id,
      });
      setStatus("例文を単語帳一覧に反映しました。");
      return;
    }

    if (currentWord.storageTable === "local_workspace") {
      updateLocalWorkspaceVocabularyExample({
        example: sentence,
        vocabularyId: currentWord.id,
      });
      setStatus("例文を単語帳一覧と作文ワークスペースの語彙に反映しました。");
      return;
    }

    if (currentWord.storageTable === "article_vocabulary_items") {
      const { error } = await supabase
        .from("article_vocabulary_items")
        .update({ example: sentence })
        .eq("id", currentWord.id);

      setStatus(
        error
          ? "画面上の単語帳一覧には反映しました。Supabaseへの保存は失敗しました。"
          : "例文を単語帳一覧とSupabaseに反映しました。"
      );
      return;
    }

    if (currentWord.storageTable === "vocabulary_items") {
      const { error } = await supabase
        .from("vocabulary_items")
        .update({ example: sentence })
        .eq("id", currentWord.id);

      setStatus(
        error
          ? "画面上の単語帳一覧には反映しました。Supabaseへの保存は失敗しました。"
          : "例文を単語帳一覧とSupabaseに反映しました。"
      );
      return;
    }

    setStatus("例文を単語帳一覧に反映しました。");
  }

  async function handleSaveTestResults() {
    const completedWords = testWords.filter((word) => word.lastCheck);

    if (completedWords.length === 0) {
      setStatus("保存できるテスト結果がまだありません。");
      return;
    }

    setIsSavingResults(true);
    setStatus("単語テストの結果をSupabaseに保存しています。");

    const sourceIds = [...new Set(completedWords.map((word) => word.sourceId))];
    const sourceTitles = sourceIds.map(
      (sourceId) => sources.find((source) => source.id === sourceId)?.title ?? sourceId
    );
    const correctCount = completedWords.filter((word) => word.lastCheck === "correct").length;
    const closeCount = completedWords.filter((word) => word.lastCheck === "close").length;
    const incorrectCount = completedWords.filter((word) => word.lastCheck === "incorrect").length;

    const { data: session, error: sessionError } = await supabase
      .from("vocabulary_test_sessions")
      .insert({
        close_count: closeCount,
        correct_count: correctCount,
        created_by_role: role,
        incorrect_count: incorrectCount,
        source_ids: sourceIds,
        source_titles: sourceTitles,
        student_id: FIXED_STUDENT_ID,
        total_count: completedWords.length,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      setIsSavingResults(false);
      setStatus("テスト履歴の保存に失敗しました。Supabase設定を確認してください。");
      return;
    }

    const { error: resultsError } = await supabase.from("vocabulary_test_results").insert(
      completedWords.map((word) => ({
        answer: word.meaningAnswer ?? "",
        article_vocabulary_item_id:
          word.storageTable === "article_vocabulary_items" ? word.id : null,
        judgement: word.lastCheck ?? "incorrect",
        judgement_label:
          word.judgeLabel ??
          (word.lastCheck === "correct" ? "正解" : word.lastCheck === "close" ? "おしい" : "不正解"),
        judgement_message: word.judgeMessage ?? null,
        learner_sentence: word.learnerSentence ?? word.example ?? null,
        meaning: word.meaning || null,
        reading: word.reading || null,
        session_id: session.id,
        source_id: word.sourceId,
        source_type: word.sourceType,
        student_id: FIXED_STUDENT_ID,
        vocabulary_item_id: word.storageTable === "vocabulary_items" ? word.id : null,
        word: word.word,
      }))
    );

    setIsSavingResults(false);

    if (resultsError) {
      setStatus("テスト回は保存されましたが、単語ごとの結果保存に失敗しました。");
      return;
    }

    setSavedSessionId(session.id);
    setStatus("単語テストの結果をSupabaseに保存しました。");
  }

  function handleNextWord() {
    if (wordIndex + 1 >= testWords.length) {
      setStage("result");
      setStatus("単語帳テストが完了しました。");
      return;
    }

    setWordIndex((currentIndex) => currentIndex + 1);
    setMeaningAnswer("");
    setSentenceDraft("");
    setJudgeResult(null);
    setSavedSessionId(null);
    setTestStep("meaning");
  }

  function handleRestartWordbook() {
    setStage("prepare");
    setMeaningAnswer("");
    setSentenceDraft("");
    setJudgeResult(null);
    setTestStep("meaning");
    setStatus("単語帳テストの素材を選び直せます。");
  }

  return (
    <section className="grid min-h-[calc(100vh-12rem)] gap-5" id="overview">
      <div className="rounded-[34px] border border-[#DDEAF1] bg-white p-3 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="grid gap-3 md:grid-cols-2">
          <TabButton
            active={activeTab === "ai"}
            description="トピックとJLPTレベルから4択問題を作る"
            label="AIクイズ生成"
            onClick={() => {
              setActiveTab("ai");
              setStatus("AIクイズ生成に切り替えました。");
            }}
          />
          <TabButton
            active={activeTab === "wordbook"}
            description="作文・AI記事の語彙から理解度を確認する"
            label="単語帳テスト"
            onClick={() => {
              setActiveTab("wordbook");
              setStatus("単語帳テストに切り替えました。");
            }}
          />
        </div>
      </div>

      {activeTab === "ai" ? (
        <AiQuizPanel
          answers={aiAnswers}
          checked={aiChecked}
          level={aiLevel}
          questions={aiQuestions}
          role={role}
          setAnswers={setAiAnswers}
          setChecked={setAiChecked}
          setLevel={setAiLevel}
          setTopic={setAiTopic}
          topic={aiTopic}
          onGenerate={handleGenerateAiQuiz}
        />
      ) : null}

      {activeTab === "wordbook" && stage === "prepare" ? (
        <WordbookPreparePanel
          expandedSourceIds={expandedSourceIds}
          selectedSourceIds={selectedSourceIds}
          sources={sources}
          totalSelectedWords={totalSelectedWords}
          words={words}
          onStart={handleStartWordbookTest}
          onToggleExpanded={toggleExpanded}
          onToggleSource={toggleSource}
        />
      ) : null}

      {activeTab === "wordbook" && stage === "test" && currentWord ? (
        <WordbookTestPanel
          currentWord={currentWord}
          judgeResult={judgeResult}
          isJudging={isJudging}
          meaningAnswer={meaningAnswer}
          progressPercent={progressPercent}
          sentenceDraft={sentenceDraft}
          testStep={testStep}
          testWords={testWords}
          wordIndex={wordIndex}
          onGoSentence={() => {
            setTestStep("sentence");
            setStatus("例文作成ページに進みました。");
          }}
          onJudge={handleJudgeWord}
          onMeaningChange={setMeaningAnswer}
          onNext={handleNextWord}
          onSaveSentence={handleSaveSentence}
          onSentenceChange={setSentenceDraft}
        />
      ) : null}

      {activeTab === "wordbook" && stage === "result" ? (
        <WordbookResultPanel
          isSaved={Boolean(savedSessionId)}
          isSaving={isSavingResults}
          testWords={testWords}
          onRestart={handleRestartWordbook}
          onSaveResults={handleSaveTestResults}
        />
      ) : null}

      <p className="rounded-[22px] bg-white/70 px-5 py-3 text-sm font-bold text-[#6F7F8A]">
        {status}
      </p>
    </section>
  );
}

function TabButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "rounded-[26px] border px-5 py-4 text-left transition",
        active
          ? "border-[#5DB6DE] bg-[#EAF7FF] shadow-[0_10px_24px_rgba(47,136,197,0.12)]"
          : "border-[#DDEAF1] bg-[#F7FCFF] hover:border-[#A9DFF0]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <p className="text-xl font-black text-[#10233B]">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-[#6F7F8A]">{description}</p>
    </button>
  );
}

function AiQuizPanel({
  answers,
  checked,
  level,
  questions,
  role,
  setAnswers,
  setChecked,
  setLevel,
  setTopic,
  topic,
  onGenerate,
}: {
  answers: Record<string, string>;
  checked: boolean;
  level: Student["level"];
  questions: AiQuestion[];
  role: Role;
  setAnswers: (answers: Record<string, string>) => void;
  setChecked: (checked: boolean) => void;
  setLevel: (level: Student["level"]) => void;
  setTopic: (topic: string) => void;
  topic: string;
  onGenerate: () => void;
}) {
  return (
    <div className="grid min-h-[calc(100vh-18rem)] gap-5 xl:grid-cols-[350px_minmax(0,1fr)]">
      <aside className="min-h-[calc(100vh-18rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-5 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#DDF4FA] text-lg font-black text-[#2F88C5]">
            AI
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">
              {role === "teacher" ? "Quiz Builder" : "Quiz Practice"}
            </p>
            <h2 className="text-xl font-black text-[#10233B]">AIクイズ生成</h2>
          </div>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-black text-[#10233B]">
          トピック
          <input
            className="min-h-12 rounded-2xl border border-[#CDEBF5] bg-[#F7FCFF] px-4 text-sm font-bold text-[#2F3337] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
            onChange={(event) => setTopic(event.target.value)}
            placeholder="例: 旅行、仕事、日本の文化"
            value={topic}
          />
        </label>

        <div className="mt-5">
          <p className="text-sm font-black text-[#10233B]">JLPTレベル</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {levelOptions.map((option) => (
              <button
                key={option}
                className={[
                  "min-h-11 rounded-2xl border text-sm font-black transition",
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

        <button
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.2)]"
          onClick={onGenerate}
          type="button"
        >
          OpenAI生成モック
        </button>
      </aside>

      <main className="min-h-[calc(100vh-18rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-6 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="flex flex-col gap-3 border-b border-[#E3EEF5] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">Multiple Choice</p>
            <h1 className="mt-1 text-3xl font-black text-[#10233B]">4択クイズ</h1>
          </div>
          <button
            className="inline-flex min-h-11 items-center rounded-full bg-[#DDF4FA] px-5 text-sm font-black text-[#2F88C5] disabled:opacity-50"
            disabled={questions.length === 0}
            onClick={() => setChecked(true)}
            type="button"
          >
            答え合わせ
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="mt-5 grid min-h-[48vh] place-items-center rounded-[28px] border border-dashed border-[#BCD9EA] bg-[#F7FCFF] px-6 text-center">
            <div>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-[#DDF4FA] text-4xl font-black text-[#2F88C5]">
                問
              </div>
              <h2 className="mt-5 text-2xl font-black text-[#10233B]">トピックから問題を生成</h2>
              <p className="mt-3 max-w-md text-sm font-bold leading-7 text-[#6F7F8A]">
                ここではOpenAI API連携前のモックとして、4択問題3問と解説を表示します。
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.id];

              return (
                <section key={question.id} className="rounded-[26px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
                  <p className="text-xs font-black text-[#2F88C5]">Question {index + 1}</p>
                  <h2 className="mt-2 text-xl font-black leading-8 text-[#10233B]">{question.question}</h2>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {question.choices.map((choice) => {
                      const isSelected = selectedAnswer === choice;
                      const isCorrect = checked && choice === question.answer;
                      const isWrong = checked && isSelected && choice !== question.answer;

                      return (
                        <button
                          key={choice}
                          className={[
                            "rounded-[20px] border px-4 py-3 text-left text-sm font-black transition",
                            isCorrect
                              ? "border-[#BFEAD2] bg-[#EAF9F0] text-[#24784F]"
                              : isWrong
                                ? "border-[#F6C9C5] bg-[#FFEDEA] text-[#B85B5B]"
                                : isSelected
                                  ? "border-[#5DB6DE] bg-[#DDF4FA] text-[#2F88C5]"
                                  : "border-[#DDEAF1] bg-white text-[#10233B]",
                          ].join(" ")}
                          onClick={() => {
                            setChecked(false);
                            setAnswers({ ...answers, [question.id]: choice });
                          }}
                          type="button"
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  {checked ? (
                    <div className="mt-4 rounded-[20px] bg-white px-4 py-3">
                      <p className="text-sm font-black text-[#2F88C5]">Explanation</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#6F7F8A]">
                        {question.explanation}
                      </p>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function WordbookPreparePanel({
  expandedSourceIds,
  selectedSourceIds,
  sources,
  totalSelectedWords,
  words,
  onStart,
  onToggleExpanded,
  onToggleSource,
}: {
  expandedSourceIds: string[];
  selectedSourceIds: string[];
  sources: QuizSource[];
  totalSelectedWords: number;
  words: QuizWord[];
  onStart: () => void;
  onToggleExpanded: (sourceId: string) => void;
  onToggleSource: (sourceId: string) => void;
}) {
  return (
    <section className="min-h-[calc(100vh-18rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-6 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#E3EEF5] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">Wordbook Test</p>
          <h1 className="mt-1 text-3xl font-black text-[#10233B]">テスト準備</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#6F7F8A]">
            作文とAI記事から、テストしたい語彙ソースを選びます。
          </p>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.2)] disabled:opacity-50"
          disabled={totalSelectedWords === 0}
          onClick={onStart}
          type="button"
        >
          {totalSelectedWords}語でテスト開始
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {sources.map((source) => {
          const sourceWords = words.filter((word) => word.sourceId === source.id);
          const isSelected = selectedSourceIds.includes(source.id);
          const isExpanded = expandedSourceIds.includes(source.id);

          return (
            <article key={source.id} className="rounded-[26px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="flex min-w-0 items-start gap-3">
                  <input
                    checked={isSelected}
                    className="mt-1 h-5 w-5 accent-[#2F88C5]"
                    onChange={() => onToggleSource(source.id)}
                    type="checkbox"
                  />
                  <span className="min-w-0">
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#2F88C5]">
                      {sourceBadgeLabel(source.type)}
                    </span>
                    <span className="mt-2 block text-xl font-black text-[#10233B]">{source.title}</span>
                    <span className="mt-1 block text-sm font-bold text-[#6F7F8A]">
                      {source.date} ・ {sourceWords.length}語
                    </span>
                  </span>
                </label>
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#CDEBF5] bg-white px-4 text-sm font-black text-[#2F88C5]"
                  onClick={() => onToggleExpanded(source.id)}
                  type="button"
                >
                  {isExpanded ? "閉じる" : "予習する"}
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {sourceWords.map((word) => (
                    <div key={word.id} className="rounded-[20px] bg-white px-4 py-3">
                      <p className="font-black text-[#10233B]">
                        {word.word}
                        <span className="ml-2 text-sm text-[#2F88C5]">{word.reading}</span>
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#6F7F8A]">{word.meaning}</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#2F3337]">{word.example}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function WordbookTestPanel({
  currentWord,
  judgeResult,
  isJudging,
  meaningAnswer,
  progressPercent,
  sentenceDraft,
  testStep,
  testWords,
  wordIndex,
  onGoSentence,
  onJudge,
  onMeaningChange,
  onNext,
  onSaveSentence,
  onSentenceChange,
}: {
  currentWord: QuizWord;
  judgeResult: JudgeResult | null;
  isJudging: boolean;
  meaningAnswer: string;
  progressPercent: number;
  sentenceDraft: string;
  testStep: WordbookTestStep;
  testWords: QuizWord[];
  wordIndex: number;
  onGoSentence: () => void;
  onJudge: () => void;
  onMeaningChange: (answer: string) => void;
  onNext: () => void;
  onSaveSentence: () => void;
  onSentenceChange: (sentence: string) => void;
}) {
  return (
    <section className="min-h-[calc(100vh-18rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-6 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#E3EEF5] pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">
              Word {wordIndex + 1} / {testWords.length}
            </p>
            <h1 className="mt-1 text-3xl font-black text-[#10233B]">
              {testStep === "meaning" ? "意味判定" : "例文作成"}
            </h1>
          </div>
          {testStep === "sentence" ? (
            <button
              className="inline-flex min-h-11 items-center rounded-full bg-[#DDF4FA] px-5 text-sm font-black text-[#2F88C5]"
              onClick={onNext}
              type="button"
            >
              {wordIndex + 1 >= testWords.length ? "結果を見る" : "次の単語"}
            </button>
          ) : null}
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#EAF4FB]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#58B4DE] to-[#1592D1]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[28px] bg-[#F7FCFF] p-5">
          <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">Current Word</p>
          <h2 className="mt-3 text-6xl font-black text-[#10233B]">{currentWord.word}</h2>
          <p className="mt-2 text-2xl font-black text-[#2F88C5]">{currentWord.reading}</p>
          <div className="mt-6 rounded-[22px] bg-white px-4 py-3">
            <p className="text-xs font-black text-[#2F88C5]">例文</p>
            <p className="mt-1 text-sm font-bold leading-6 text-[#6F7F8A]">{currentWord.example}</p>
          </div>
        </section>

        {testStep === "meaning" ? (
          <div className="rounded-[28px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
            <label className="grid gap-3 text-sm font-black text-[#10233B]">
              意味を自由記述で入力
              <textarea
                className="min-h-28 w-full resize-none rounded-[20px] border border-[#D6E4EA] bg-white px-4 py-4 text-base font-bold leading-7 text-[#10233B] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
                onChange={(event) => onMeaningChange(event.target.value)}
                placeholder="例: temple / quiet place / souvenir"
                value={meaningAnswer}
              />
            </label>
            <button
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#DDF4FA] px-5 text-sm font-black text-[#2F88C5] disabled:opacity-50"
              disabled={!meaningAnswer.trim() || isJudging}
              onClick={onJudge}
              type="button"
            >
              {isJudging ? "判定中..." : "OpenAIで判定"}
            </button>
            {judgeResult ? (
              <div
                className={[
                  "mt-4 rounded-[22px] border px-4 py-3",
                  judgeResult.tone === "correct"
                    ? "border-[#BFEAD2] bg-[#EAF9F0]"
                    : judgeResult.tone === "close"
                      ? "border-[#F7D7A9] bg-[#FFF2DF]"
                      : "border-[#F6C9C5] bg-[#FFEDEA]",
                ].join(" ")}
              >
                <p className="text-lg font-black text-[#10233B]">{judgeLabelWithIcon(judgeResult)}</p>
                <p className="mt-1 text-sm font-bold leading-6 text-[#6F7F8A]">{judgeResult.message}</p>
                <button
                  className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.18)]"
                  onClick={onGoSentence}
                  type="button"
                >
                  例文作成へ
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[28px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">Sentence Practice</p>
            <h2 className="mt-1 text-2xl font-black text-[#10233B]">
              判定後の例文作成
            </h2>
            {judgeResult ? (
              <div
                className={[
                  "mt-4 rounded-[22px] border px-4 py-3",
                  judgeResult.tone === "correct"
                    ? "border-[#BFEAD2] bg-[#EAF9F0]"
                    : judgeResult.tone === "close"
                      ? "border-[#F7D7A9] bg-[#FFF2DF]"
                      : "border-[#F6C9C5] bg-[#FFEDEA]",
                ].join(" ")}
              >
                <p className="text-sm font-black text-[#10233B]">
                  意味判定: {judgeLabelWithIcon(judgeResult)}
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-[#6F7F8A]">
                  {judgeResult.message}
                </p>
              </div>
            ) : null}
            <label className="grid gap-3 text-sm font-black text-[#10233B]">
              この単語で1行作文
              <textarea
                className="min-h-28 w-full resize-none rounded-[20px] border border-[#D6E4EA] bg-white px-4 py-4 text-base font-bold leading-7 text-[#10233B] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
                onChange={(event) => onSentenceChange(event.target.value)}
                placeholder={`${currentWord.word}を使って短い文を書きます。`}
                value={sentenceDraft}
              />
            </label>
            <button
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.18)] disabled:opacity-50"
              disabled={!sentenceDraft.trim()}
              onClick={onSaveSentence}
              type="button"
            >
              例文を同期
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function WordbookResultPanel({
  isSaved,
  isSaving,
  testWords,
  onRestart,
  onSaveResults,
}: {
  isSaved: boolean;
  isSaving: boolean;
  testWords: QuizWord[];
  onRestart: () => void;
  onSaveResults: () => void;
}) {
  const completedCount = testWords.filter((word) => word.lastCheck).length;

  return (
    <section className="min-h-[calc(100vh-18rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-6 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#E3EEF5] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#2F88C5]">Result</p>
          <h1 className="mt-1 text-3xl font-black text-[#10233B]">テスト完了</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-[#6F7F8A]">
            {testWords.length}問中 {completedCount}問を確認しました。語彙銀行に例文が蓄積されます。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.18)] disabled:opacity-50"
            disabled={isSaving || isSaved || completedCount === 0}
            onClick={onSaveResults}
            type="button"
          >
            {isSaved ? "結果を保存済み" : isSaving ? "保存中..." : "結果を保存"}
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#DDF4FA] px-5 text-sm font-black text-[#2F88C5]"
            onClick={onRestart}
            type="button"
          >
            素材を選び直す
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[26px] border border-[#DDEAF1]">
        <div className="grid grid-cols-[1fr_1fr_1.4fr] bg-[#F7FCFF] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#2F88C5]">
          <span>単語</span>
          <span>意味</span>
          <span>自分の例文</span>
        </div>
        {testWords.map((word) => (
          <div
            key={word.id}
            className="grid grid-cols-[1fr_1fr_1.4fr] gap-3 border-t border-[#DDEAF1] bg-white px-4 py-4 text-sm font-bold leading-6 text-[#10233B]"
          >
            <span>
              {word.word}
              <span className="ml-2 text-[#2F88C5]">{word.reading}</span>
            </span>
            <span>{word.meaning}</span>
            <span>{word.learnerSentence || "まだ例文がありません"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
