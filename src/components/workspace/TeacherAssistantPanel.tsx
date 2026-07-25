"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { WorkspaceQuestionEntry } from "@/lib/types";

export type TeacherTab = "question" | "support";

type TeacherAssistantPanelProps = {
  activeTab: TeacherTab;
  onTabChange: (tab: TeacherTab) => void;
  questionEntries: WorkspaceQuestionEntry[];
  selectedText: string;
  selectedSentence: string;
  onSaveQuestion: (question: string) => void;
  onSaveReply: (reply: string) => void;
};

const supportMessages = [
  {
    title: "やさしい英語説明",
    template: (word: string) =>
      `${word || "この言葉"} means a key word from the lesson. You can use it in a short example and explain it with simple words.`,
    tone: "soft",
  },
  {
    title: "やさしい日本語説明",
    template: (word: string) =>
      `${word || "この言葉"}は、レッスンで大事な言葉です。短い文で意味を見せると、学習者に伝わりやすくなります。`,
    tone: "plain",
  },
  {
    title: "授業で使う例文",
    template: (word: string) => `${word || "この言葉"}を使って、一文作ってみましょう。`,
    tone: "plain",
  },
];

export function TeacherAssistantPanel({
  activeTab,
  onTabChange,
  questionEntries,
  selectedText,
  selectedSentence,
  onSaveQuestion,
  onSaveReply,
}: TeacherAssistantPanelProps) {
  return (
    <section className="min-h-[460px] rounded-[34px] border border-[#DDEAF1] bg-white p-5 shadow-[0_16px_42px_rgba(47,136,197,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-full bg-[#EEF6FC] p-1 shadow-inner">
          <TabButton
            active={activeTab === "question"}
            icon="?"
            label="質問"
            onClick={() => onTabChange("question")}
          />
          <TabButton
            active={activeTab === "support"}
            icon={<span className="chat-bubble-icon scale-[0.9]" aria-hidden="true" />}
            label="講師サポート"
            onClick={() => onTabChange("support")}
          />
        </div>

        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D6E4EA] bg-white px-4 text-sm font-black text-[#5F6971] shadow-sm"
          type="button"
        >
          <span>›</span>
          折りたたむ
        </button>
      </div>

      {activeTab === "support" ? (
        <SupportView selectedText={selectedText} selectedSentence={selectedSentence} />
      ) : (
        <QuestionView
          questionEntries={questionEntries}
          selectedText={selectedText}
          selectedSentence={selectedSentence}
          onSaveQuestion={onSaveQuestion}
          onSaveReply={onSaveReply}
        />
      )}
    </section>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-black transition",
        active
          ? "bg-[#DDF4FA] text-[#158CD0] shadow-[0_8px_18px_rgba(47,136,197,0.12)]"
          : "text-[#6F7F8A]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-xs text-[#158CD0]">
        {typeof icon === "string" ? icon : icon}
      </span>
      {label}
    </button>
  );
}

function SupportView({
  selectedText,
  selectedSentence,
}: {
  selectedText: string;
  selectedSentence: string;
}) {
  const focusWord = selectedText || "お寺";
  const focusSentence = selectedSentence || "友だちと鎌倉へ行って、お寺を見ました。";

  return (
    <>
      <h2 className="mt-5 text-xl font-black text-[#10233B]">講師サポート</h2>
      <p className="mt-3 text-sm font-bold leading-6 text-[#7B8C98]">
        選択した語句について、授業中に使える説明をチャット形式で確認します。
      </p>

      <div className="mt-5 grid gap-3 rounded-[26px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
        <div className="flex justify-end">
          <div className="max-w-[82%] rounded-[22px] rounded-tr-md bg-[#DDF4FA] px-4 py-3 text-sm font-bold leading-6 text-[#10233B]">
            選択した語句: {focusWord}
          </div>
        </div>
        <div className="rounded-[20px] border border-dashed border-[#C9DCE8] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#5F6971]">
          例の文: {focusSentence}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {supportMessages.map((message) => (
          <div key={message.title} className="flex gap-3">
            <div className="chat-bubble-icon mt-1" aria-hidden="true" />
            <div
              className={[
                "max-w-[82%] rounded-[22px] rounded-tl-md border border-[#DDEAF1] px-4 py-3 text-sm leading-6 text-[#5F6971]",
                message.tone === "soft" ? "bg-[#F7FCFF]" : "bg-white",
              ].join(" ")}
            >
              <p className="font-black text-[#158CD0]">{message.title}</p>
              <p className="mt-1 font-bold">{message.template(focusWord)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {["英語説明", "日本語説明", "例文", "質問生成"].map((label) => (
          <button
            key={label}
            className="min-h-10 rounded-full bg-[#EEF8FF] px-3 text-sm font-black text-[#158CD0]"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

function QuestionView({
  questionEntries,
  selectedText,
  selectedSentence,
  onSaveQuestion,
  onSaveReply,
}: {
  questionEntries: WorkspaceQuestionEntry[];
  selectedText: string;
  selectedSentence: string;
  onSaveQuestion: (question: string) => void;
  onSaveReply: (reply: string) => void;
}) {
  const [questionDraft, setQuestionDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");

  return (
    <>
      <h2 className="mt-5 text-xl font-black text-[#10233B]">質問</h2>
      <p className="mt-3 text-sm font-bold leading-6 text-[#7B8C98]">
        選択した言葉や文と、生徒からの質問を記録します。講師はその場で返答メモを残せます。
      </p>

      <div className="mt-5 rounded-[26px] border border-[#DDEAF1] bg-[#F7FCFF] p-4">
        <p className="text-xs font-black tracking-[0.16em] text-[#7B8C98]">QUESTION CONTEXT</p>
        <div className="mt-3 rounded-[20px] bg-[#DDF4FA] px-4 py-3 text-sm font-bold leading-6 text-[#10233B]">
          選択した語句: {selectedText || "まだ選択されていません"}
        </div>
        <div className="mt-3 rounded-[20px] border border-dashed border-[#C9DCE8] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#5F6971]">
          選択した文: {selectedSentence || "本文から文を選ぶとここに表示されます。"}
        </div>
      </div>

      <div className="mt-4 rounded-[26px] border border-[#DDEAF1] bg-white p-4">
        <label className="block text-sm font-black text-[#10233B]">
          生徒の質問
          <textarea
            className="mt-3 min-h-24 w-full resize-none rounded-[20px] border border-[#D6E4EA] bg-[#FCFEFF] px-4 py-4 text-sm font-bold leading-6 text-[#10233B] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
            onChange={(event) => setQuestionDraft(event.target.value)}
            placeholder="生徒が聞いたことをここに記録します。"
            value={questionDraft}
          />
        </label>
        <div className="mt-4 flex justify-end">
          <button
            className="inline-flex min-h-11 items-center rounded-full bg-[#EEF8FF] px-5 text-sm font-black text-[#158CD0] disabled:opacity-60"
            disabled={!questionDraft.trim()}
            onClick={() => {
              onSaveQuestion(questionDraft.trim());
              setQuestionDraft("");
            }}
            type="button"
          >
            質問を記録
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {questionEntries.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#CCDDE8] bg-[#F7FCFF] px-5 py-8 text-center text-sm font-bold leading-7 text-[#7B8C98]">
            まだ質問の記録がありません。本文を選択してから、質問を追加できます。
          </div>
        ) : (
          questionEntries.map((message) => (
            <div
              key={message.id}
              className={message.speaker === "teacher" ? "flex justify-end" : "flex gap-3"}
            >
              {message.speaker === "student" ? (
                <div className="chat-bubble-icon mt-1" aria-hidden="true" />
              ) : null}

              <div
                className={[
                  "max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6",
                  message.speaker === "teacher"
                    ? "rounded-tr-md bg-[#DDF4FA] font-bold text-[#10233B]"
                    : "rounded-tl-md border border-[#DDEAF1] bg-[#F7FCFF] text-[#5F6971]",
                ].join(" ")}
              >
                <p className="font-black text-[#158CD0]">{message.label}</p>
                <p className="mt-1 font-bold">{message.body}</p>
                {message.speaker === "student" ? (
                  <p className="mt-3 text-xs font-bold text-[#7B8C98]">
                    対象: {message.selectedText || "未選択"}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 rounded-[26px] border border-[#DDEAF1] bg-white p-4">
        <label className="block text-sm font-black text-[#10233B]">
          講師の返答
          <textarea
            className="mt-3 min-h-28 w-full resize-none rounded-[20px] border border-[#D6E4EA] bg-[#FCFEFF] px-4 py-4 text-sm font-bold leading-6 text-[#10233B] outline-none placeholder:text-[#94A3AE] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/15"
            onChange={(event) => setReplyDraft(event.target.value)}
            placeholder="授業で返した説明やメモを書きます。"
            value={replyDraft}
          />
        </label>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs font-bold leading-5 text-[#7B8C98]">
            返答はこのタブ内に保存され、次に同じ表現が出たときのメモになります。
          </p>
          <button
            className="inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-[#58B4DE] to-[#1592D1] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(47,136,197,0.18)] disabled:opacity-60"
            disabled={!replyDraft.trim()}
            onClick={() => {
              onSaveReply(replyDraft.trim());
              setReplyDraft("");
            }}
            type="button"
          >
            返答を記録
          </button>
        </div>
      </div>
    </>
  );
}
