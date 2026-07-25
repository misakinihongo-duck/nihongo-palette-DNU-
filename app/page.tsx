import Link from "next/link";
import { LessonIllustration } from "@/components/illustrations/LessonIllustration";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:p-10">
      <section className="login-frame mx-auto grid min-h-[min(860px,calc(100vh-5rem))] max-w-7xl gap-6 rounded-[42px] p-5 sm:p-6 lg:grid-cols-[140px_minmax(0,1fr)]">
        <aside className="hidden rounded-[30px] bg-gradient-to-b from-[#8FD4EA] to-[#6EC3DF] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] lg:flex lg:flex-col lg:items-center lg:justify-between lg:px-5 lg:py-8">
          <div className="h-12 w-12 rounded-full border border-white/55 bg-white/22" />
          <div className="grid h-10 w-10 place-items-center rounded-2xl text-2xl font-bold text-white/95">
            ↪
          </div>
        </aside>

        <div className="grid gap-8 px-2 py-3 sm:px-5 lg:grid-cols-[450px_minmax(0,1fr)] lg:px-8 lg:py-9">
          <section className="flex flex-col">
            <header className="mb-8 flex items-center gap-5">
              <div className="palette-logo" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-wide text-[#214F73] sm:text-5xl">
                  日本語パレット
                </h1>
                <p className="mt-2 text-lg font-bold text-[#6F7F8A]">
                  楽しく学ぼう、日本語の世界。
                </p>
              </div>
            </header>

            <div className="login-card mt-auto w-full rounded-[30px] bg-white/88 p-6 shadow-[0_24px_70px_rgba(47,136,197,0.14)] sm:p-8">
              <h2 className="text-3xl font-black text-[#2F3337]">おかえりなさい</h2>
              <p className="mt-3 text-base font-semibold text-[#6F7F8A]">
                レッスンの準備をはじめましょう。
              </p>

              <div className="mt-8 grid gap-5">
                <label className="grid gap-3 text-sm font-black text-[#2F3337]">
                  メールアドレス
                  <span className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#D6E4EA] bg-white px-4 text-[#A3B1BA]">
                    <span className="text-xl">✉</span>
                    <input
                      className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#2F3337] outline-none placeholder:text-[#A3B1BA]"
                      placeholder="メールアドレスを入力"
                      type="email"
                    />
                  </span>
                </label>

                <label className="grid gap-3 text-sm font-black text-[#2F3337]">
                  パスワード
                  <span className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#D6E4EA] bg-white px-4 text-[#A3B1BA]">
                    <span className="text-xl">▣</span>
                    <input
                      className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#2F3337] outline-none placeholder:text-[#A3B1BA]"
                      placeholder="パスワードを入力"
                      type="password"
                    />
                    <span className="text-xl">◌</span>
                  </span>
                </label>

                <label className="flex items-center gap-3 text-sm font-bold text-[#5F6971]">
                  <input
                    className="h-5 w-5 rounded border-[#B8C8D0] text-[#5DB6DE]"
                    type="checkbox"
                  />
                  ログイン状態を保持
                </label>

                <Link
                  className="grid min-h-14 place-items-center rounded-2xl bg-gradient-to-r from-[#58B4DE] to-[#32A4D5] text-base font-black text-white shadow-[0_18px_34px_rgba(47,136,197,0.24)] transition hover:brightness-95"
                  href="/dashboard?role=teacher"
                >
                  ログイン
                </Link>

                <div className="flex items-center gap-5 text-sm font-bold text-[#9AA9B3]">
                  <span className="h-px flex-1 bg-[#DDE7EC]" />
                  または
                  <span className="h-px flex-1 bg-[#DDE7EC]" />
                </div>

                <Link
                  className="flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-[#BFD0D8] bg-white text-base font-black text-[#2F3337] transition hover:bg-[#F7FCFF]"
                  href="/dashboard?role=student"
                >
                  <span className="text-xl font-black text-[#4285F4]">G</span>
                  Googleでログイン
                </Link>
              </div>

              <div className="mt-8 flex flex-col gap-3 text-sm font-black text-[#2F88C5] sm:flex-row sm:items-center sm:justify-between">
                <Link href="/dashboard?role=teacher">パスワードを忘れた方</Link>
                <Link href="/dashboard?role=student">新規登録</Link>
              </div>

              <div className="mt-8 rounded-[24px] border border-[#D6EAF5] bg-[#F7FCFF] p-4">
                <p className="text-sm font-black text-[#2F88C5]">
                  テスト用 View 切り替え
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-sm font-black text-[#10233B]">講師View</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Link
                        className="grid min-h-11 place-items-center rounded-xl bg-[#DDF4FA] px-3 text-sm font-black text-[#158CD0]"
                        href="/dashboard?role=teacher"
                      >
                        講師ダッシュボード
                      </Link>
                      <Link
                        className="grid min-h-11 place-items-center rounded-xl bg-[#DDF4FA] px-3 text-sm font-black text-[#158CD0]"
                        href="/workspace?role=teacher"
                      >
                        作文ワークスペース
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-sm font-black text-[#10233B]">生徒View</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Link
                        className="grid min-h-11 place-items-center rounded-xl bg-[#FFE7E3] px-3 text-sm font-black text-[#D36F65]"
                        href="/dashboard?role=student"
                      >
                        学習ダッシュボード
                      </Link>
                      <Link
                        className="grid min-h-11 place-items-center rounded-xl bg-[#FFE7E3] px-3 text-sm font-black text-[#D36F65]"
                        href="/workspace?role=student"
                      >
                        作文ワークスペース
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="hidden items-center justify-center lg:flex">
            <div className="w-full max-w-[620px]">
              <LessonIllustration />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
