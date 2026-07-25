import { Card } from "@/components/ui/Card";
import { vocabulary } from "@/lib/mock-data";

export function StudentReviewPanel() {
  const items = vocabulary.filter((item) => item.studentId === "student-1");

  return (
    <Card className="sticky top-4 bg-[#F7FCFF]/95" id="vocabulary">
      <p className="text-sm font-bold text-[#2F88C5]">生徒用</p>
      <h2 className="mt-1 text-xl font-bold text-[#2F3337]">語彙・復習</h2>
      <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
        レッスンで追加された単語を確認します。クイズ生成は後続フェーズです。
      </p>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-[24px] bg-white p-4">
            <p className="font-bold text-[#2F3337]">
              {item.word} <span className="text-sm">({item.reading})</span>
            </p>
            <p className="mt-1 text-sm text-[#6F7F8A]">{item.meaning}</p>
            <p className="mt-2 text-sm leading-6 text-[#2F3337]">{item.example}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] bg-[#FFE7E3] p-4">
        <p className="text-sm font-bold text-[#2F3337]">今日の復習</p>
        <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
          「お寺」を使って、旅行について一文作ってみましょう。
        </p>
      </div>
    </Card>
  );
}
