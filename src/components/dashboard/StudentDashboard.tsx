import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { LessonChart } from "@/components/dashboard/LessonChart";
import { Card } from "@/components/ui/Card";
import { articles, vocabulary, writings } from "@/lib/mock-data";

export function StudentDashboard() {
  const myWritings = writings.filter((writing) => writing.studentId === "student-1");
  const myVocabulary = vocabulary.filter((item) => item.studentId === "student-1");
  const myArticles = articles.filter((article) => article.studentId === "student-1");

  return (
    <div className="grid gap-6" id="overview">
      <Card className="relative overflow-hidden bg-[#F7FCFF]">
        <div className="sakura right-10 top-6 scale-75 opacity-50" />
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-bold text-[#2F88C5]">生徒ダッシュボード</p>
            <h2 className="mt-2 text-3xl font-bold text-[#2F3337]">
              Emmaさんの学習ページ
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6F7F8A]">
              レッスンで書いた作文、追加された単語、読む記事をやさしく確認できます。
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <FeatureCard
          title="作文"
          description="先生と一緒に書いた作文と、ふりがな・添削メモを確認します。"
          href="/workspace?role=student"
          kind="writing"
          accent="blue"
        />
        <FeatureCard
          title="語彙"
          description="レッスンで出てきた単語を見直し、次の復習につなげます。"
          href="/vocabulary?role=student"
          kind="vocabulary"
          accent="pink"
        />
        <FeatureCard
          title="記事"
          description="自分のレベルに合った短い読解記事を読む準備画面です。"
          href="/articles?role=student"
          kind="article"
          accent="orange"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-bold text-[#6F7F8A]">作文</p>
              <p className="mt-2 text-3xl font-bold text-[#2F88C5]">{myWritings.length}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#6F7F8A]">単語</p>
              <p className="mt-2 text-3xl font-bold text-[#2F88C5]">{myVocabulary.length}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#6F7F8A]">記事</p>
              <p className="mt-2 text-3xl font-bold text-[#2F88C5]">{myArticles.length}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {myWritings.map((writing) => (
              <div key={writing.id} className="rounded-[24px] bg-[#F7FCFF] p-4">
                <p className="font-bold text-[#2F3337]">{writing.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#6F7F8A]">
                  {writing.draft}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <LessonChart />
          <Card className="bg-[#F7FCFF]">
            <h2 className="text-xl font-bold text-[#2F3337]">復習する単語</h2>
            <div className="mt-4 grid gap-3">
              {myVocabulary.map((item) => (
                <div key={item.id} className="rounded-[22px] bg-white p-4">
                  <p className="font-bold text-[#2F3337]">
                    {item.word} <span className="text-sm">({item.reading})</span>
                  </p>
                  <p className="mt-1 text-sm text-[#6F7F8A]">{item.meaning}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
