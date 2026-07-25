"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { TeacherAssistantPanel, type TeacherTab } from "@/components/workspace/TeacherAssistantPanel";
import { buildFuriganaPreview, buildFuriganaSegments, guessReading } from "@/lib/furigana";
import { fetchFuriganaSegments, fetchVocabularyReading } from "@/lib/furigana-client";
import { fetchVocabularyMeaning } from "@/lib/vocabulary-meaning-client";
import type { FuriganaSegment } from "@/lib/furigana";
import { corrections, vocabulary, writings } from "@/lib/mock-data";
import { FIXED_STUDENT_ID } from "@/lib/supabase/constants";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type {
  Role,
  WorkspaceCorrection,
  WorkspaceQuestionEntry,
  WorkspaceVocabularyItem,
  Writing,
} from "@/lib/types";

const STORAGE_KEY = "nihongo-palette-phase2-workspace";
const STORAGE_EVENT = "nihongo-palette-workspace-updated";
const writingTextClasses = "text-base font-normal leading-8";

type WorkspaceClientProps = {
  role: Role;
};

type StoredWorkspaceState = {
  writings: Writing[];
  vocabulary: WorkspaceVocabularyItem[];
  corrections: WorkspaceCorrection[];
  questionEntries: WorkspaceQuestionEntry[];
  currentWritingId: string;
};

type ActionOverlayState = {
  x: number;
  y: number;
  text: string;
};

type DiffChunk = {
  type: "equal" | "delete" | "insert";
  text: string;
};

type WritingRow = Database["public"]["Tables"]["writings"]["Row"];
type VocabularyRow = Database["public"]["Tables"]["vocabulary_items"]["Row"];
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type CorrectionRow = Database["public"]["Tables"]["corrections"]["Row"];

const initialWritings: Writing[] = writings.map((writing) => ({
  id: writing.id,
  studentId: writing.studentId,
  title: writing.title,
  draft: writing.draft,
  furiganaPreview: writing.furiganaPreview,
  updatedAt: writing.updatedAt,
}));

const initialVocabulary: WorkspaceVocabularyItem[] = vocabulary.map((item) => ({
  ...item,
  writingId: item.studentId === "student-1" ? "writing-1" : "writing-2",
  sourceSentence: item.example,
  createdAt: "2026-05-05",
}));

const initialCorrections: WorkspaceCorrection[] = corrections.map((item) => ({
  ...item,
  createdAt: "2026-05-05",
}));

const initialQuestionEntries: WorkspaceQuestionEntry[] = [
  {
    id: "question-initial-1",
    writingId: "writing-1",
    speaker: "student",
    label: "生徒の質問",
    body: "「お寺」って、英語でどう説明しますか。",
    selectedText: "お寺",
    selectedSentence: "友だちと鎌倉へ行って、お寺を見ました。",
    createdAt: "2026-05-05",
  },
];

const initialWorkspaceState: StoredWorkspaceState = {
  writings: initialWritings,
  vocabulary: initialVocabulary,
  corrections: initialCorrections,
  questionEntries: initialQuestionEntries,
  currentWritingId: initialWritings[0]?.id ?? "",
};

let cachedWorkspaceRaw: string | null | undefined;
let cachedWorkspaceState = initialWorkspaceState;

function normalizeWorkspaceState(state: Partial<StoredWorkspaceState>): StoredWorkspaceState {
  return {
    writings: state.writings?.length ? state.writings : initialWritings,
    vocabulary: state.vocabulary?.length ? state.vocabulary : initialVocabulary,
    corrections: state.corrections?.length ? state.corrections : initialCorrections,
    questionEntries: state.questionEntries?.length ? state.questionEntries : initialQuestionEntries,
    currentWritingId:
      state.currentWritingId && state.writings?.some((item) => item.id === state.currentWritingId)
        ? state.currentWritingId
        : initialWritings[0]?.id ?? "",
  };
}

function getWorkspaceSnapshot() {
  if (typeof window === "undefined") {
    return initialWorkspaceState;
  }

  const savedState = window.localStorage.getItem(STORAGE_KEY);

  if (savedState === cachedWorkspaceRaw) {
    return cachedWorkspaceState;
  }

  cachedWorkspaceRaw = savedState;

  if (!savedState) {
    cachedWorkspaceState = initialWorkspaceState;
    return initialWorkspaceState;
  }

  try {
    cachedWorkspaceState = normalizeWorkspaceState(JSON.parse(savedState) as Partial<StoredWorkspaceState>);
    return cachedWorkspaceState;
  } catch {
    cachedWorkspaceState = initialWorkspaceState;
    return initialWorkspaceState;
  }
}

function subscribeWorkspaceStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
}

function writeWorkspaceSnapshot(state: StoredWorkspaceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function mapWritingRow(row: WritingRow): Writing {
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    draft: row.draft,
    furiganaPreview: row.furigana_preview ?? "",
    updatedAt: formatDisplayDate(new Date(row.updated_at)),
  };
}

function mapVocabularyRow(row: VocabularyRow): WorkspaceVocabularyItem {
  return {
    id: row.id,
    studentId: row.student_id,
    writingId: row.writing_id ?? undefined,
    word: row.word,
    reading: row.reading ?? "",
    meaning: row.meaning ?? "",
    example: row.example ?? "",
    sourceSentence: row.source_sentence ?? undefined,
    createdAt: formatDisplayDate(new Date(row.created_at)),
  };
}

function mapQuestionRow(row: QuestionRow): WorkspaceQuestionEntry {
  return {
    id: row.id,
    writingId: row.writing_id,
    speaker: row.speaker,
    label: row.label ?? (row.speaker === "teacher" ? "講師の返答メモ" : "生徒の質問"),
    body: row.body,
    selectedText: row.selected_text ?? "",
    selectedSentence: row.selected_sentence ?? "",
    createdAt: formatDisplayDate(new Date(row.created_at)),
  };
}

function mapCorrectionRow(row: CorrectionRow): WorkspaceCorrection {
  return {
    id: row.id,
    writingId: row.writing_id,
    before: row.before_text,
    after: row.after_text,
    note: row.note ?? "",
    createdAt: formatDisplayDate(new Date(row.created_at)),
  };
}

function buildInlineDiff(before: string, after: string): DiffChunk[] {
  const beforeChars = Array.from(before);
  const afterChars = Array.from(after);
  const table = Array.from({ length: beforeChars.length + 1 }, () =>
    Array<number>(afterChars.length + 1).fill(0)
  );

  for (let beforeIndex = beforeChars.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = afterChars.length - 1; afterIndex >= 0; afterIndex -= 1) {
      table[beforeIndex][afterIndex] =
        beforeChars[beforeIndex] === afterChars[afterIndex]
          ? table[beforeIndex + 1][afterIndex + 1] + 1
          : Math.max(table[beforeIndex + 1][afterIndex], table[beforeIndex][afterIndex + 1]);
    }
  }

  const chunks: DiffChunk[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  function pushChunk(type: DiffChunk["type"], text: string) {
    const lastChunk = chunks[chunks.length - 1];

    if (lastChunk?.type === type) {
      lastChunk.text += text;
      return;
    }

    chunks.push({ type, text });
  }

  while (beforeIndex < beforeChars.length || afterIndex < afterChars.length) {
    if (
      beforeIndex < beforeChars.length &&
      afterIndex < afterChars.length &&
      beforeChars[beforeIndex] === afterChars[afterIndex]
    ) {
      pushChunk("equal", beforeChars[beforeIndex]);
      beforeIndex += 1;
      afterIndex += 1;
    } else if (
      afterIndex < afterChars.length &&
      (beforeIndex === beforeChars.length ||
        table[beforeIndex][afterIndex + 1] >= table[beforeIndex + 1][afterIndex])
    ) {
      pushChunk("insert", afterChars[afterIndex]);
      afterIndex += 1;
    } else if (beforeIndex < beforeChars.length) {
      pushChunk("delete", beforeChars[beforeIndex]);
      beforeIndex += 1;
    }
  }

  return chunks;
}

function buildFullTextDiff(sourceText: string, correctionItems: WorkspaceCorrection[]): DiffChunk[] {
  const source = sourceText || correctionItems[0]?.before || "";
  const indexedCorrections = correctionItems
    .map((correction) => {
      const beforeIndex = correction.before ? source.indexOf(correction.before) : -1;

      if (beforeIndex >= 0) {
        return {
          correction,
          end: beforeIndex + correction.before.length,
          start: beforeIndex,
        };
      }

      const afterIndex = correction.after ? source.indexOf(correction.after) : -1;

      if (afterIndex >= 0) {
        return {
          correction,
          end: afterIndex + correction.after.length,
          start: afterIndex,
        };
      }

      return null;
    })
    .filter((item): item is { correction: WorkspaceCorrection; end: number; start: number } => item !== null)
    .sort((left, right) => left.start - right.start);

  if (indexedCorrections.length === 0) {
    return [{ type: "equal", text: source }];
  }

  const chunks: DiffChunk[] = [];
  let cursor = 0;

  indexedCorrections.forEach(({ correction, end, start }) => {
    if (start < cursor) {
      return;
    }

    chunks.push({ type: "equal", text: source.slice(cursor, start) });
    chunks.push(...buildInlineDiff(correction.before, correction.after));
    cursor = end;
  });

  chunks.push({ type: "equal", text: source.slice(cursor) });

  return chunks.filter((chunk) => chunk.text);
}

function CorrectionDiffView({
  baselineText,
  corrections: correctionItems,
  sourceText,
}: {
  baselineText?: string;
  corrections: WorkspaceCorrection[];
  sourceText: string;
}) {
  const chunks = useMemo(
    () =>
      correctionItems.length > 0
        ? buildFullTextDiff(sourceText, correctionItems)
        : baselineText && baselineText !== sourceText
          ? buildInlineDiff(baselineText, sourceText)
          : [{ type: "equal" as const, text: sourceText }],
    [baselineText, correctionItems, sourceText]
  );

  return (
    <p className="mt-4 whitespace-pre-wrap text-base font-normal leading-9 text-[#10233B]">
      {chunks.map((chunk, index) => {
        const key = `${chunk.type}-${index}-${chunk.text}`;

        if (chunk.type === "delete") {
          return (
            <del
              className="mx-0.5 rounded-md bg-[#FFE2DF] px-1 text-[#B94E4E] decoration-[#D95F5F] decoration-2"
              key={key}
            >
              {chunk.text}
            </del>
          );
        }

        if (chunk.type === "insert") {
          return (
            <ins
              className="mx-0.5 rounded-md bg-[#DFF5E8] px-1 text-[#236B4E] no-underline"
              key={key}
            >
              {chunk.text}
            </ins>
          );
        }

        return <span key={key}>{chunk.text}</span>;
      })}
    </p>
  );
}

export function WorkspaceClient({ role }: WorkspaceClientProps) {
  const workspaceState = useSyncExternalStore(
    subscribeWorkspaceStore,
    getWorkspaceSnapshot,
    () => initialWorkspaceState
  );
  const [selectionText, setSelectionText] = useState("お寺");
  const [selectionSentence, setSelectionSentence] = useState(
    "友だちと鎌倉へ行って、お寺を見ました。"
  );
  const [composerMode, setComposerMode] = useState<"view" | "edit">("edit");
  const [furiganaEnabled, setFuriganaEnabled] = useState(true);
  const [teacherTab, setTeacherTab] = useState<TeacherTab>("support");
  const [saveMessage, setSaveMessage] = useState("ローカル保存で使えます。");
  const [actionOverlay, setActionOverlay] = useState<ActionOverlayState | null>(null);
  const [isDbBusy, setIsDbBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const draftBaselinesRef = useRef<Record<string, string>>({});
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const renderedContentRef = useRef<HTMLDivElement | null>(null);

  const currentWriting =
    workspaceState.writings.find((item) => item.id === workspaceState.currentWritingId) ??
    workspaceState.writings[0];
  const currentBaselineDraft = currentWriting
    ? draftBaselinesRef.current[currentWriting.id] ?? currentWriting.draft
    : "";

  const deferredDraft = useDeferredValue(currentWriting?.draft ?? "");
  const fallbackFuriganaSegments = useMemo(() => buildFuriganaSegments(deferredDraft), [deferredDraft]);
  const [parsedFuriganaSegments, setParsedFuriganaSegments] = useState<FuriganaSegment[]>(fallbackFuriganaSegments);
  const furiganaSegments =
    deferredDraft.trim() && parsedFuriganaSegments.length > 0
      ? parsedFuriganaSegments
      : fallbackFuriganaSegments;
  const currentCorrections = useMemo(
    () => workspaceState.corrections.filter((item) => item.writingId === currentWriting?.id),
    [currentWriting?.id, workspaceState.corrections]
  );
  const currentVocabulary = useMemo(
    () => workspaceState.vocabulary.filter((item) => item.writingId === currentWriting?.id),
    [currentWriting?.id, workspaceState.vocabulary]
  );
  const currentQuestionEntries = useMemo(
    () => workspaceState.questionEntries.filter((item) => item.writingId === currentWriting?.id),
    [currentWriting?.id, workspaceState.questionEntries]
  );

  useEffect(() => {
    let isActive = true;

    async function loadWritings() {
      setIsDbBusy(true);
      setSaveMessage("Supabaseから作文・語彙・質問・添削履歴を読み込んでいます。");

      const [writingsResult, vocabularyResult, questionsResult, correctionsResult] = await Promise.all([
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
          .from("questions")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("corrections")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (!isActive) {
        return;
      }

      setIsDbBusy(false);

      if (writingsResult.error) {
        setSaveMessage("Supabase読み込みに失敗しました。ローカル表示を使います。");
        return;
      }

      const dbWritings = writingsResult.data.map(mapWritingRow);
      for (const writing of dbWritings) {
        draftBaselinesRef.current[writing.id] ??= writing.draft;
      }
      const writingIds = new Set(dbWritings.map((writing) => writing.id));
      const dbVocabulary = vocabularyResult.error
        ? initialVocabulary
        : vocabularyResult.data.map(mapVocabularyRow);
      const dbQuestionEntries = questionsResult.error
        ? initialQuestionEntries
        : questionsResult.data.map(mapQuestionRow).filter((entry) => writingIds.has(entry.writingId));
      const dbCorrections = correctionsResult.error
        ? getWorkspaceSnapshot().corrections
        : correctionsResult.data.map(mapCorrectionRow).filter((entry) => writingIds.has(entry.writingId));

      if (dbWritings.length === 0) {
        setSaveMessage("Supabaseに作文がありません。ローカル表示を使います。");
        return;
      }

      updateWorkspaceState((currentState) => ({
        ...currentState,
        writings: dbWritings,
        vocabulary: dbVocabulary,
        questionEntries: dbQuestionEntries,
        corrections: dbCorrections.length > 0 ? dbCorrections : currentState.corrections,
        currentWritingId: dbWritings.some((writing) => writing.id === currentState.currentWritingId)
          ? currentState.currentWritingId
          : dbWritings[0].id,
      }));
      setSaveMessage("Supabaseから作文・語彙・質問・添削履歴を読み込みました。");
    }

    void loadWritings();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!deferredDraft.trim()) {
      return () => controller.abort();
    }

    const timeoutId = window.setTimeout(() => {
      fetchFuriganaSegments(deferredDraft, controller.signal)
        .then((segments) => {
          if (segments.length > 0) {
            setParsedFuriganaSegments(segments);
          }
        })
        .catch(() => {
          setParsedFuriganaSegments(fallbackFuriganaSegments);
        });
    }, 320);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [deferredDraft, fallbackFuriganaSegments]);

  function updateCurrentWriting(fields: Partial<Writing>) {
    if (!currentWriting) {
      return;
    }

    updateWorkspaceState((currentState) => ({
      ...currentState,
      writings: currentState.writings.map((item) =>
        item.id === currentWriting.id ? { ...item, ...fields } : item
      ),
    }));
  }

  function updateWorkspaceState(
    updater: (currentState: StoredWorkspaceState) => StoredWorkspaceState
  ) {
    writeWorkspaceSnapshot(updater(getWorkspaceSnapshot()));
  }

  async function handleSaveWriting() {
    if (!currentWriting) {
      return;
    }

    const updatedWriting: Writing = {
      ...currentWriting,
      updatedAt: formatDisplayDate(new Date()),
      furiganaPreview: buildFuriganaPreview(currentWriting.draft),
    };

    startTransition(() => {
      updateCurrentWriting(updatedWriting);
    });

    setIsDbBusy(true);
    setSaveMessage("Supabaseに保存しています。");

    const baselineDraft = draftBaselinesRef.current[currentWriting.id] ?? currentWriting.draft;
    const shouldSaveTrackedChange = baselineDraft.trim() && baselineDraft !== updatedWriting.draft;

    const { error } = await supabase.from("writings").upsert({
      draft: updatedWriting.draft,
      furigana_preview: updatedWriting.furiganaPreview,
      id: updatedWriting.id,
      student_id: FIXED_STUDENT_ID,
      title: updatedWriting.title || "無題の作文",
      updated_at: new Date().toISOString(),
    });

    setIsDbBusy(false);

    if (error) {
      setSaveMessage("ローカル保存は完了。Supabase保存に失敗しました。");
      return;
    }

    if (shouldSaveTrackedChange) {
      const existingFullDraftCorrection = workspaceState.corrections.find(
        (correction) =>
          correction.writingId === updatedWriting.id &&
          correction.before === baselineDraft &&
          correction.after === updatedWriting.draft
      );

      if (!existingFullDraftCorrection) {
        const draftCorrection: WorkspaceCorrection = {
          id: `correction-${Date.now()}`,
          writingId: updatedWriting.id,
          before: baselineDraft,
          after: updatedWriting.draft,
          note: "",
          createdAt: formatDisplayDate(new Date()),
        };
        const { data: correctionData, error: correctionError } = await supabase
          .from("corrections")
          .insert({
            after_text: draftCorrection.after,
            before_text: draftCorrection.before,
            note: null,
            writing_id: updatedWriting.id,
          })
          .select("*")
          .single();
        const nextCorrection = correctionData ? mapCorrectionRow(correctionData) : draftCorrection;

        updateWorkspaceState((currentState) => ({
          ...currentState,
          corrections: [...currentState.corrections, nextCorrection],
        }));

        if (correctionError) {
          setSaveMessage("作文は保存しました。添削履歴はローカルに反映しました。");
          draftBaselinesRef.current[updatedWriting.id] = updatedWriting.draft;
          return;
        }
      }
    }

    draftBaselinesRef.current[updatedWriting.id] = updatedWriting.draft;
    setSaveMessage("Supabaseに作文と添削履歴を保存しました。");
  }

  async function handleCreateWriting() {
    setIsDbBusy(true);
    setSaveMessage("Supabaseに新しい作文を作成しています。");

    const { data, error } = await supabase
      .from("writings")
      .insert({
        draft: "",
        furigana_preview: "",
        student_id: FIXED_STUDENT_ID,
        title: "新しい作文",
      })
      .select("*")
      .single();

    setIsDbBusy(false);

    if (error) {
      const fallbackWriting: Writing = {
        id: `writing-${Date.now()}`,
        studentId: FIXED_STUDENT_ID,
        title: "新しい作文",
        draft: "",
        furiganaPreview: "",
        updatedAt: formatDisplayDate(new Date()),
      };

      updateWorkspaceState((currentState) => ({
        ...currentState,
        writings: [fallbackWriting, ...currentState.writings],
        currentWritingId: fallbackWriting.id,
      }));
      draftBaselinesRef.current[fallbackWriting.id] = fallbackWriting.draft;
      setSaveMessage("Supabase作成に失敗しました。ローカルで新規作成しました。");
      return;
    }

    const newWriting = mapWritingRow(data);
    draftBaselinesRef.current[newWriting.id] = newWriting.draft;

    updateWorkspaceState((currentState) => ({
      ...currentState,
      writings: [newWriting, ...currentState.writings],
      currentWritingId: newWriting.id,
    }));
    setSelectionText("");
    setSelectionSentence("");
    setTeacherTab(role === "teacher" ? "question" : "support");
    setSaveMessage("Supabaseに新しい作文を作成しました。");
  }

  function handleSelectionCapture(event: KeyboardEvent<HTMLTextAreaElement> | MouseEvent<HTMLTextAreaElement>) {
    const node = textAreaRef.current;

    if (!node || !currentWriting?.draft) {
      return;
    }

    const start = node.selectionStart ?? 0;
    const end = node.selectionEnd ?? 0;

    if (start === end) {
      return;
    }

    const selected = currentWriting.draft.slice(start, end).trim();

    if (!selected) {
      return;
    }

    setSelectionText(selected);
    setSelectionSentence(extractSentence(currentWriting.draft, start, end));
    setActionOverlay({
      x: "clientX" in event ? event.clientX : node.getBoundingClientRect().left + node.clientWidth / 2,
      y: "clientY" in event ? event.clientY + 15 : node.getBoundingClientRect().bottom + 15,
      text: selected,
    });
  }

  function handleRenderedSelectionCapture() {
    if (!renderedContentRef.current || !currentWriting?.draft) {
      return;
    }

    const selected = window.getSelection()?.toString().trim() ?? "";

    if (!selected || !currentWriting.draft.includes(selected)) {
      return;
    }

    const range = window.getSelection()?.rangeCount
      ? window.getSelection()?.getRangeAt(0)
      : null;
    const rect = range?.getBoundingClientRect();
    const start = currentWriting.draft.indexOf(selected);
    const end = start + selected.length;

    setSelectionText(selected);
    setSelectionSentence(extractSentence(currentWriting.draft, start, end));
    setActionOverlay({
      x: rect && rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect && rect.height > 0 ? rect.bottom + 15 : window.innerHeight / 2,
      text: selected,
    });
  }

  async function handleAddVocabulary() {
    if (!selectionText || !currentWriting) {
      return;
    }

    const duplicateItem = workspaceState.vocabulary.find(
      (item) => item.writingId === currentWriting.id && item.word === selectionText
    );

    if (duplicateItem) {
      setSaveMessage("この語句はすでに語彙リストにあります。");
      return;
    }

    setSaveMessage(`「${selectionText}」のよみと意味を確認しています。`);
    const [reading, meaning] = await Promise.all([
      fetchVocabularyReading(selectionText).catch(() => ""),
      fetchVocabularyMeaning(selectionText, selectionSentence).catch(() => ""),
    ]);

    const draftItem: WorkspaceVocabularyItem = {
      id: `vocab-${Date.now()}`,
      studentId: FIXED_STUDENT_ID,
      writingId: currentWriting.id,
      word: selectionText,
      reading: reading || guessReading(selectionText) || "よみを追加",
      meaning: meaning || "meaning to add",
      example: "",
      sourceSentence: "",
      createdAt: formatDisplayDate(new Date()),
    };

    setIsDbBusy(true);
    setSaveMessage(`「${selectionText}」をSupabaseに追加しています。`);

    const { data, error } = await supabase
      .from("vocabulary_items")
      .insert({
        example: draftItem.example,
        meaning: draftItem.meaning,
        reading: draftItem.reading,
        source_sentence: draftItem.sourceSentence,
        student_id: FIXED_STUDENT_ID,
        word: draftItem.word,
        writing_id: currentWriting.id,
      })
      .select("*")
      .single();

    setIsDbBusy(false);

    const nextItem = data ? mapVocabularyRow(data) : draftItem;

    startTransition(() => {
      updateWorkspaceState((currentState) => ({
        ...currentState,
        vocabulary: [nextItem, ...currentState.vocabulary],
      }));
      setActionOverlay(null);
    });

    if (error) {
      setSaveMessage(`「${selectionText}」をローカル語彙リストに追加しました。Supabase保存は失敗しました。`);
      return;
    }

    setSaveMessage(`「${selectionText}」をSupabaseの語彙リストに追加しました。`);
  }

  function handleUpdateVocabularyExample(itemId: string, example: string) {
    updateWorkspaceState((currentState) => ({
      ...currentState,
      vocabulary: currentState.vocabulary.map((item) =>
        item.id === itemId ? { ...item, example, sourceSentence: "" } : item
      ),
    }));
  }

  async function handleSaveVocabularyExample(item: WorkspaceVocabularyItem) {
    const { error } = await supabase
      .from("vocabulary_items")
      .update({ example: item.example, source_sentence: "" })
      .eq("id", item.id);

    if (error) {
      setSaveMessage("例文メモのSupabase保存に失敗しました。");
      return;
    }

    setSaveMessage("例文メモを保存しました。");
  }

  function handleAddQuestionContext() {
    if (!selectionText && !selectionSentence) {
      return;
    }

    setTeacherTab("question");
    setActionOverlay(null);
    setSaveMessage("質問タブに選択した語句を送りました。");
  }

  async function handleCopySelection() {
    if (!selectionText) {
      return;
    }

    await navigator.clipboard.writeText(selectionText).catch(() => undefined);
    setActionOverlay(null);
    setSaveMessage(`「${selectionText}」をコピーしました。`);
  }

  function handleTranslateSelection() {
    if (!selectionText) {
      return;
    }

    setActionOverlay(null);
    setSaveMessage(`翻訳メモ: 「${selectionText}」を確認中です。`);
  }

  async function handleSaveQuestion(question: string) {
    if (!currentWriting || !question.trim()) {
      return;
    }

    const draftEntry: WorkspaceQuestionEntry = {
      id: `question-${Date.now()}`,
      writingId: currentWriting.id,
      speaker: "student",
      label: "生徒の質問",
      body: question.trim(),
      selectedText: selectionText,
      selectedSentence: selectionSentence,
      createdAt: formatDisplayDate(new Date()),
    };

    setIsDbBusy(true);
    setSaveMessage("質問をSupabaseに保存しています。");

    const { data, error } = await supabase
      .from("questions")
      .insert({
        body: draftEntry.body,
        label: draftEntry.label,
        selected_sentence: draftEntry.selectedSentence || null,
        selected_text: draftEntry.selectedText || null,
        speaker: "student",
        writing_id: currentWriting.id,
      })
      .select("*")
      .single();

    setIsDbBusy(false);

    const nextEntry = data ? mapQuestionRow(data) : draftEntry;

    startTransition(() => {
      updateWorkspaceState((currentState) => ({
        ...currentState,
        questionEntries: [...currentState.questionEntries, nextEntry],
      }));
    });

    if (error) {
      setSaveMessage("質問をローカルに記録しました。Supabase保存は失敗しました。");
      return;
    }

    setSaveMessage("質問をSupabaseに記録しました。");
  }

  async function handleSaveReply(reply: string) {
    if (!currentWriting || !reply.trim()) {
      return;
    }

    const draftEntry: WorkspaceQuestionEntry = {
      id: `reply-${Date.now()}`,
      writingId: currentWriting.id,
      speaker: "teacher",
      label: "講師の返答メモ",
      body: reply.trim(),
      selectedText: selectionText,
      selectedSentence: selectionSentence,
      createdAt: formatDisplayDate(new Date()),
    };

    setIsDbBusy(true);
    setSaveMessage("返答メモをSupabaseに保存しています。");

    const { data, error } = await supabase
      .from("questions")
      .insert({
        body: draftEntry.body,
        label: draftEntry.label,
        selected_sentence: draftEntry.selectedSentence || null,
        selected_text: draftEntry.selectedText || null,
        speaker: "teacher",
        writing_id: currentWriting.id,
      })
      .select("*")
      .single();

    setIsDbBusy(false);

    const nextEntry = data ? mapQuestionRow(data) : draftEntry;

    startTransition(() => {
      updateWorkspaceState((currentState) => ({
        ...currentState,
        questionEntries: [...currentState.questionEntries, nextEntry],
      }));
    });

    if (error) {
      setSaveMessage("返答メモをローカルに記録しました。Supabase保存は失敗しました。");
      return;
    }

    setSaveMessage("返答メモをSupabaseに記録しました。");
  }

  return (
    <section className="grid gap-5 p-5 xl:grid-cols-[350px_minmax(0,1fr)_380px]">
      <aside className="min-h-[calc(100vh-8rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-5 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="flex items-center justify-between">
          <PanelBadge icon="▦">Workspace</PanelBadge>
          <SoftButton>
            <span>‹</span>
            隠す
          </SoftButton>
        </div>

        <h2 className="mt-5 text-xl font-black text-[#10233B]">保存した作文</h2>

        <div className="mt-8 rounded-xl bg-[#EAF7FF] p-1">
          <div className="flex items-center justify-between rounded-lg border-l-4 border-[#1592D1] bg-[#E8F6FF] px-3 py-3 text-[#158CD0]">
            <span className="font-black">{role === "teacher" ? "担当生徒の作文" : "自分の作文"}</span>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#CFE4F2] bg-white px-4 py-2 text-sm font-black"
              onClick={handleCreateWriting}
              type="button"
            >
              ＋ 新規
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 px-1">
          {workspaceState.writings.map((writing) => {
            const isActive = writing.id === currentWriting?.id;

            return (
              <button
                key={writing.id}
                className={[
                  "rounded-[20px] px-4 py-3 text-left transition",
                  isActive ? "bg-[#F2FAFF] shadow-[0_10px_22px_rgba(47,136,197,0.08)]" : "bg-transparent",
                ].join(" ")}
                onClick={() => {
                  updateWorkspaceState((currentState) => ({
                    ...currentState,
                    currentWritingId: writing.id,
                  }));
                }}
                type="button"
              >
                <p className="text-base font-black text-[#10233B]">{writing.title}</p>
                <p className="mt-1 text-sm font-bold text-[#A3AAB8]">{writing.updatedAt}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="min-h-[calc(100vh-8rem)] rounded-[34px] border border-[#DDEAF1] bg-white p-6 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PanelBadge icon="▤">Composer</PanelBadge>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <ComposerSwitchGroup
              label=""
              options={[
                {
                  key: "view",
                  label: "閲覧",
                  active: composerMode === "view",
                  onClick: () => setComposerMode("view"),
                },
                {
                  key: "edit",
                  label: "編集",
                  active: composerMode === "edit",
                  onClick: () => setComposerMode("edit"),
                },
              ]}
            />
            <ComposerSwitchGroup
              label="ふりがな"
              options={[
                {
                  key: "on",
                  label: "あり",
                  active: furiganaEnabled,
                  onClick: () => setFuriganaEnabled(true),
                },
                {
                  key: "off",
                  label: "なし",
                  active: !furiganaEnabled,
                  onClick: () => setFuriganaEnabled(false),
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-7">
          <h1 className="text-2xl font-black text-[#10233B]">作文</h1>
          <p className="mt-3 text-base font-bold text-[#7B8C98]">
            入力した作文をこのブラウザに保存します。選択した語句は質問や語彙に追加できます。
          </p>
        </div>

        <label className="mt-7 block text-lg font-black text-[#10233B]">
          タイトル
          {composerMode === "edit" ? (
            <input
              className="mt-4 min-h-16 w-full rounded-2xl border border-[#D6E4EA] bg-white px-6 text-xl font-bold text-[#10233B] outline-none placeholder:text-[#AAB3BE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
              onChange={(event) => updateCurrentWriting({ title: event.target.value })}
              placeholder="例: 私の週末"
              value={currentWriting?.title ?? ""}
            />
          ) : (
            <div className="mt-4 flex min-h-16 items-center rounded-2xl border border-[#D9E8F2] bg-[#F9FCFE] px-6 text-2xl font-black text-[#203247]">
              {currentWriting?.title || "タイトル未入力"}
            </div>
          )}
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-5 text-base font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.2)] disabled:opacity-60"
            disabled={isPending || isDbBusy}
            onClick={handleSaveWriting}
            type="button"
          >
            ✓ 保存
          </button>
          <p className="text-sm font-bold text-[#7B8C98]">{saveMessage}</p>
        </div>

        {composerMode === "edit" ? (
          <textarea
            ref={textAreaRef}
            className={`mt-5 min-h-[280px] w-full resize-none rounded-2xl border border-[#D6E4EA] bg-white px-7 py-8 ${writingTextClasses} text-[#10233B] outline-none placeholder:text-[#7B8C98] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15`}
            onChange={(event) =>
              updateCurrentWriting({
                draft: event.target.value,
                furiganaPreview: buildFuriganaPreview(event.target.value),
              })
            }
            onBlur={() => window.setTimeout(() => setActionOverlay(null), 180)}
            onKeyUp={handleSelectionCapture}
            onMouseUp={handleSelectionCapture}
            placeholder="ここに作文を書きましょう。"
            value={currentWriting?.draft ?? ""}
          />
        ) : (
          <div
            ref={renderedContentRef}
            className={`mt-5 min-h-[280px] rounded-[28px] border border-[#D9E8F2] bg-[#F9FCFE] px-7 py-8 ${writingTextClasses} text-[#203247] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]`}
            onMouseUp={handleRenderedSelectionCapture}
          >
            {currentWriting?.draft ? (
              <RubyText segments={furiganaSegments} showFurigana={furiganaEnabled} />
            ) : (
              <p className="text-lg font-bold text-[#7B8C98]">
                ここに作文を書くと、閲覧モードで読みやすく表示されます。
              </p>
            )}
          </div>
        )}

        {composerMode === "edit" ? (
          <section className="mt-6 rounded-2xl border border-[#DDEAF1] bg-[#F7FCFF] p-4">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#10233B]">
              <span className="text-[#1592D1]">あ</span>
              ふりがなプレビュー
            </h2>
            <div className={`mt-4 rounded-[20px] border border-[#DDEAF1] bg-white px-5 py-4 ${writingTextClasses} text-[#10233B]`}>
              <RubyText segments={furiganaSegments} showFurigana={furiganaEnabled} />
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-[28px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
          <div className="rounded-[24px] border border-[#DDEAF1] bg-white p-5 shadow-[0_14px_34px_rgba(47,136,197,0.08)]">
            <PanelBadge icon="✎">Corrections</PanelBadge>
            <h2 className="mt-3 text-2xl font-black text-[#10233B]">Tracked Changes</h2>
            <div className="mt-4 rounded-[20px] border border-[#DDEAF1] bg-[#FBFEFF] px-5 py-5">
              {currentCorrections.length > 0 ? (
                <CorrectionDiffView
                  baselineText={currentBaselineDraft}
                  corrections={currentCorrections}
                  sourceText={currentWriting?.draft ?? ""}
                />
              ) : currentBaselineDraft !== (currentWriting?.draft ?? "") ? (
                <CorrectionDiffView
                  baselineText={currentBaselineDraft}
                  corrections={[]}
                  sourceText={currentWriting?.draft ?? ""}
                />
              ) : (
                <p className="whitespace-pre-wrap text-base font-normal leading-9 text-[#10233B]">
                  {currentWriting?.draft || "作文がまだありません。"}
                </p>
              )}
            </div>
          </div>
        </section>
      </section>

      <aside className="grid gap-5">
        <section className="rounded-[34px] border border-[#DDEAF1] bg-white p-5 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
          <div className="flex items-center justify-between">
            <PanelBadge icon="▱">Memory bank</PanelBadge>
            <SoftButton>
              <span>‹</span>
              隠す
            </SoftButton>
          </div>
          <h2 className="mt-5 text-xl font-black text-[#10233B]">語彙リスト</h2>
          {currentVocabulary.length === 0 ? (
            <div className="mt-6 grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#CCDDE8] px-8 text-center">
              <p className="text-base font-bold leading-7 text-[#7B8C98]">
                まだ語彙がありません。本文の
                <br />
                テキストを選択して追加しましょう。
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {currentVocabulary.map((item) => (
                <article key={item.id} className="rounded-[22px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
                  <p className="font-black text-[#10233B]">
                    {item.word}
                    <span className="ml-2 text-sm text-[#158CD0]">{item.reading}</span>
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#7B8C98]">{item.meaning}</p>
                  <textarea
                    className="mt-3 min-h-20 w-full resize-none rounded-[18px] border border-[#D6E4EA] bg-white px-3 py-3 text-sm font-bold leading-6 text-[#5F6971] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
                    onBlur={() => void handleSaveVocabularyExample(item)}
                    onChange={(event) => handleUpdateVocabularyExample(item.id, event.target.value)}
                    placeholder="例文やメモを入力"
                    value={item.example}
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        {role === "teacher" ? (
          <TeacherAssistantPanel
            activeTab={teacherTab}
            onSaveQuestion={handleSaveQuestion}
            onSaveReply={handleSaveReply}
            onTabChange={setTeacherTab}
            questionEntries={currentQuestionEntries}
            selectedSentence={selectionSentence}
            selectedText={selectionText}
          />
        ) : (
          <StudentReviewPanel
            questionEntries={currentQuestionEntries}
            vocabularyItems={currentVocabulary}
          />
        )}
      </aside>

      {actionOverlay ? (
        <ActionOverlay
          role={role}
          selectedText={actionOverlay.text}
          x={actionOverlay.x}
          y={actionOverlay.y}
          onAddQuestion={handleAddQuestionContext}
          onAddVocabulary={handleAddVocabulary}
          onCopy={handleCopySelection}
          onTranslate={handleTranslateSelection}
        />
      ) : null}
    </section>
  );
}

function ActionOverlay({
  role,
  selectedText,
  x,
  y,
  onAddQuestion,
  onAddVocabulary,
  onCopy,
  onTranslate,
}: {
  role: Role;
  selectedText: string;
  x: number;
  y: number;
  onAddQuestion: () => void;
  onAddVocabulary: () => void;
  onCopy: () => void;
  onTranslate: () => void;
}) {
  const actions = [
    { label: "翻訳", onClick: onTranslate },
    { label: "語彙追加", onClick: onAddVocabulary },
    { label: "コピー", onClick: onCopy },
    ...(role === "teacher" ? [{ label: "質問追加", onClick: onAddQuestion }] : []),
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

function StudentReviewPanel({
  questionEntries,
  vocabularyItems,
}: {
  questionEntries: WorkspaceQuestionEntry[];
  vocabularyItems: WorkspaceVocabularyItem[];
}) {
  const hasQuestions = questionEntries.length > 0;
  const teacherReplies = questionEntries.filter((entry) => entry.speaker === "teacher");

  return (
    <section className="min-h-[460px] rounded-[34px] border border-[#DDEAF1] bg-white p-5 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
      <div className="flex items-center justify-between">
        <PanelBadge icon="○">Review notes</PanelBadge>
        <SoftButton>
          <span>›</span>
          折りたたむ
        </SoftButton>
      </div>

      <h2 className="mt-5 text-xl font-black text-[#10233B]">質問と先生の返答</h2>
      <p className="mt-3 text-sm font-bold leading-6 text-[#7B8C98]">
        レッスン中に出た質問と、先生の返答メモをここで復習できます。
      </p>

      <div className="mt-5 grid gap-3">
        {!hasQuestions ? (
          <div className="rounded-[24px] border border-dashed border-[#CCDDE8] bg-[#F7FCFF] px-5 py-8 text-center text-sm font-bold leading-7 text-[#7B8C98]">
            まだ質問や先生の返答がありません。
          </div>
        ) : (
          questionEntries.map((entry) => (
            <article
              key={entry.id}
              className={[
                "rounded-[22px] border px-4 py-4",
                entry.speaker === "teacher"
                  ? "border-[#CDEBF5] bg-[#EAF8FF]"
                  : "border-[#DDEAF1] bg-[#F7FCFF]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className={[
                    "text-xs font-black",
                    entry.speaker === "teacher" ? "text-[#2F88C5]" : "text-[#6F7F8A]",
                  ].join(" ")}
                >
                  {entry.speaker === "teacher" ? "先生の返答" : "生徒の質問"}
                </p>
                <p className="text-xs font-bold text-[#A3AAB8]">{entry.createdAt}</p>
              </div>
              {entry.selectedText ? (
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#2F88C5]">
                  {entry.selectedText}
                </p>
              ) : null}
              <p className="mt-3 text-sm font-bold leading-6 text-[#10233B]">{entry.body}</p>
              {entry.selectedSentence && entry.speaker === "student" ? (
                <p className="mt-3 rounded-[16px] border border-dashed border-[#C9DCE8] bg-white px-3 py-2 text-xs font-bold leading-5 text-[#6F7F8A]">
                  {entry.selectedSentence}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>

      <div className="mt-5 border-t border-[#E3EEF5] pt-5">
        <h3 className="text-base font-black text-[#10233B]">語彙の復習</h3>
        <div className="mt-3 grid gap-3">
          {vocabularyItems.slice(0, 3).map((item) => (
            <article
              key={item.id}
              className="rounded-[20px] border border-[#DDEAF1] bg-[#FBFEFF] px-4 py-3"
            >
              <p className="text-sm font-black text-[#10233B]">
                {item.word}
                <span className="ml-2 text-xs text-[#2F88C5]">{item.reading}</span>
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-[#6F7F8A]">
                {item.example || item.meaning}
              </p>
            </article>
          ))}
          {vocabularyItems.length === 0 ? (
            <p className="text-sm font-bold text-[#7B8C98]">語彙はまだありません。</p>
          ) : null}
        </div>
      </div>

      {teacherReplies.length > 0 ? (
        <p className="mt-4 rounded-[18px] bg-[#DDF4FA] px-4 py-3 text-xs font-black leading-5 text-[#2F88C5]">
          先生の返答 {teacherReplies.length}件を復習できます。
        </p>
      ) : null}
    </section>
  );
}

function PanelBadge({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF8FF] px-4 py-2 text-base font-black text-[#158CD0]">
      <span>{icon}</span>
      {children}
    </span>
  );
}

function ComposerSwitchGroup({
  label,
  options,
}: {
  label: string;
  options: Array<{
    key: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }>;
}) {
  return (
    <div className="flex items-center gap-3">
      {label ? <span className="text-sm font-black text-[#6F7F8A]">{label}</span> : null}
      <div className="flex rounded-[24px] border border-[#D9E8F2] bg-[#EEF7FC] p-1.5 shadow-[0_10px_24px_rgba(47,136,197,0.08)]">
        {options.map((option) => (
          <button
            key={option.key}
            className={[
              "min-h-14 min-w-28 rounded-[18px] px-5 text-lg font-black transition",
              option.active
                ? "bg-white text-[#2F88C5] shadow-[0_8px_20px_rgba(47,136,197,0.12)]"
                : "text-[#7B8C98]",
            ].join(" ")}
            onClick={option.onClick}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
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

function SoftButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6E4EA] bg-white px-4 text-sm font-black text-[#5F6971] shadow-sm"
      type="button"
    >
      {children}
    </button>
  );
}

function extractSentence(text: string, start: number, end: number) {
  const beforeText = text.slice(0, start);
  const afterText = text.slice(end);
  const sentenceStart = Math.max(
    beforeText.lastIndexOf("。"),
    beforeText.lastIndexOf("！"),
    beforeText.lastIndexOf("？"),
    beforeText.lastIndexOf("\n")
  );
  const sentenceEndCandidates = [
    afterText.indexOf("。"),
    afterText.indexOf("！"),
    afterText.indexOf("？"),
    afterText.indexOf("\n"),
  ].filter((index) => index >= 0);
  const sentenceEndOffset =
    sentenceEndCandidates.length > 0 ? Math.min(...sentenceEndCandidates) : afterText.length;

  return text.slice(sentenceStart + 1, end + sentenceEndOffset + 1).trim();
}

function formatDisplayDate(date: Date) {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
