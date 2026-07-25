import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";

export function TeacherSupportPanel() {
  return (
    <Card className="sticky top-4 bg-[#F7FCFF]/95">
      <p className="text-sm font-bold text-[#2F88C5]">講師専用</p>
      <h2 className="mt-1 text-xl font-bold text-[#2F3337]">Teacher Support Panel</h2>
      <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
        Phase 1では固定サンプルを表示します。OpenAI API接続は後続フェーズです。
      </p>

      <div className="mt-5 grid gap-4">
        <TextField label="選択した語句" value="お寺" />

        <div className="rounded-[24px] bg-white p-4">
          <p className="text-sm font-bold text-[#2F3337]">Easy English</p>
          <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
            Otera means a Buddhist temple. You can visit an otera to see old
            buildings, gardens, and statues.
          </p>
        </div>

        <div className="rounded-[24px] bg-white p-4">
          <p className="text-sm font-bold text-[#2F3337]">やさしい日本語</p>
          <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
            お寺は、仏教のための建物です。静かな場所で、古い建物を見ることができます。
          </p>
        </div>

        <div className="rounded-[24px] border border-dashed border-[#5DB6DE] bg-white/60 p-4">
          <p className="text-sm font-bold text-[#2F3337]">例文</p>
          <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
            京都で有名なお寺を見ました。
          </p>
        </div>
      </div>
    </Card>
  );
}
