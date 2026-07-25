import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { LessonChart } from "@/components/dashboard/LessonChart";
import { Card } from "@/components/ui/Card";
import { articles, students, vocabulary, writings } from "@/lib/mock-data";

export function TeacherDashboard() {
  return (
    <div className="grid gap-6" id="overview">
      <Card className="relative overflow-hidden bg-[#F7FCFF]">
        <div className="sakura right-10 top-5 scale-75 opacity-50" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#2F88C5]">講師ダッシュボード</p>
            <h2 className="mt-2 text-3xl font-bold text-[#2F3337]">
              今日のレッスン準備
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F7F8A]">
              担当生徒を選び、作文・語彙・記事の3つの入口からレッスン素材を確認します。
            </p>
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-between gap-5 rounded-2xl border border-[#CDEBF5] bg-white px-5 text-left text-sm font-bold text-[#2F3337] shadow-[0_12px_28px_rgba(47,136,197,0.1)]"
            type="button"
          >
            <span>
              担当生徒
              <span className="ml-3 text-[#2F88C5]">{students[0].name}</span>
            </span>
            <span className="text-[#5DB6DE]">⌄</span>
          </button>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <FeatureCard
          title="作文"
          description="レッスン中の作文入力、ふりがな、添削履歴をひとつの画面で扱います。"
          href="/workspace?role=teacher"
          kind="writing"
          accent="blue"
        />
        <FeatureCard
          title="語彙"
          description="作文から出てきた大切な単語を集め、復習につなげる入口です。"
          href="/vocabulary?role=teacher"
          kind="vocabulary"
          accent="pink"
        />
        <FeatureCard
          title="記事"
          description="JLPTレベルと興味に合わせた読解教材を作るための準備画面です。"
          href="/articles?role=teacher"
          kind="article"
          accent="orange"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-bold text-[#6F7F8A]">担当生徒</p>
              <p className="mt-2 text-3xl font-bold text-[#2F88C5]">{students.length}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#6F7F8A]">最近の作文</p>
              <p className="mt-2 text-3xl font-bold text-[#2F88C5]">{writings.length}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#6F7F8A]">登録語彙</p>
              <p className="mt-2 text-3xl font-bold text-[#2F88C5]">{vocabulary.length}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="rounded-[24px] border border-[#CDEBF5] bg-[#F7FCFF] p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-[#2F3337]">{student.name}</p>
                    <p className="text-sm text-[#6F7F8A]">
                      {student.level} ・ {student.interest}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#2F88C5]">
                    {student.nextLessonFocus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <LessonChart />
          <Card className="bg-[#F7FCFF]">
            <h2 className="text-xl font-bold text-[#2F3337]">最近の記事</h2>
            <div className="mt-4 grid gap-3">
              {articles.map((article) => (
                <div key={article.id} className="rounded-[22px] bg-white p-4">
                  <p className="text-xs font-bold text-[#2F88C5]">
                    {article.level} ・ {article.topic}
                  </p>
                  <p className="mt-1 font-bold text-[#2F3337]">{article.title}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
