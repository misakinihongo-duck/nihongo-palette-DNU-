import { TextArea } from "@/components/ui/Field";
import { corrections, writings } from "@/lib/mock-data";

const currentWriting = writings[0];

export function WritingEditor() {
  return (
    <section className="grid gap-4">
      <div className="rounded-[32px] border border-white/80 bg-white p-5 shadow-[0_18px_48px_rgba(47,136,197,0.12)]" id="writing">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#2F88C5]">作文ワークスペース</p>
            <h2 className="mt-1 text-2xl font-bold text-[#2F3337]">{currentWriting.title}</h2>
          </div>
          <span className="rounded-full bg-[#DDF4FA] px-3 py-1 text-xs font-bold text-[#2F88C5]">
            ふりがな ON
          </span>
        </div>

        <div className="mt-5">
          <TextArea label="作文入力エリア" value={currentWriting.draft} rows={9} />
        </div>

        <div className="mt-5 rounded-[24px] border border-[#CDEBF5] bg-[#F7FCFF] p-4">
          <p className="text-sm font-bold text-[#2F3337]">ふりがなプレビュー</p>
          <p className="mt-2 text-base leading-8 text-[#2F3337]">
            {currentWriting.furiganaPreview}
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/80 bg-white p-5 shadow-[0_18px_48px_rgba(47,136,197,0.12)]">
        <h2 className="text-lg font-bold text-[#2F3337]">添削履歴</h2>
        <div className="mt-4 grid gap-3">
          {corrections.map((correction) => (
            <article
              key={correction.id}
              className="rounded-[24px] border border-[#CDEBF5] bg-[#F7FCFF] p-4"
            >
              <p className="text-sm font-semibold text-[#D97430]">Before: {correction.before}</p>
              <p className="mt-1 text-sm font-semibold text-[#2F88C5]">After: {correction.after}</p>
              <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">{correction.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
