# Nihongo Palette

Nihongo Palette は、日本語レッスンを行う講師のためのWebアプリです。作文、ふりがな、語彙、添削履歴、AI生成記事、語彙テストをひとつのワークスペースで扱えるようにすることを目的にしています。

現在の実装はMVP / ローカル開発版です。本ログインはまだ入れておらず、固定の講師ID・生徒IDを使って、Supabaseへの保存やOpenAIを使った一部AI機能を検証できる状態です。本番向けの認証、権限管理、厳密なRLSは今後のフェーズで対応します。

## プロジェクトの状態

このリポジトリには、Nihongo Palette MVPの動作プロトタイプが入っています。

実装済み:

- 仮ログイン画面での講師 / 生徒ビュー切り替え
- 講師 / 生徒ダッシュボード
- 作文ワークスペース
- 作文の編集モード / 閲覧モード切り替え
- ふりがな表示のON / OFF
- テキスト選択時のアクションポップオーバー
- 語彙追加、質問追加、講師返信
- 添削箇所を全文内で表示するTracked Changesビュー
- OpenAIを使った記事生成
- 形態素解析によるふりがな生成
- 語彙リストと語彙テストのUI
- OpenAIによる語彙テスト回答判定
- Supabaseへの作文、語彙、質問、添削、記事、語彙テスト履歴の保存

今後対応予定 / 本番未対応:

- 本ログイン
- 講師 / 生徒ごとの厳密なアクセス制御
- Google Sheet / Google Calendar連携
- 本番用RLSポリシー
- デプロイ設定

## 技術スタック

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- OpenAI API
- kuromoji: 日本語の形態素解析 / ふりがな生成補助

> 注意: このプロジェクトは新しいNext.jsを使っています。古いApp Routerの実装例と挙動が異なる可能性があります。Next.jsの挙動や構成を変更する場合は、まず `AGENTS.md` と `node_modules/next/dist/docs/` 以下のローカルドキュメントを確認してください。

## ページ構成と機能

### `/`

仮ログイン / ロール選択画面です。

- 講師向けログイン風UI
- 生徒向けGoogleログイン風UI
- テスト用の講師View / 生徒View切り替えボタン
- ダッシュボード、作文ワークスペースへの導線

### `/dashboard?role=teacher`

講師用ダッシュボードです。

- 講師向けの概要表示
- 授業準備に必要な情報の入口
- 作文、語彙、記事の機能カード
- レッスン数の簡易チャート
- 各ワークスペースへの導線

### `/dashboard?role=student`

生徒用ダッシュボードです。

- 生徒向けの学習状況表示
- 作文、語彙、記事の学習導線
- 復習を意識した文言とレイアウト
- 講師向けの生徒選択UIは表示しません

### `/workspace?role=teacher`

講師用の作文ワークスペースです。

主な構成:

- 左パネル: 保存済み作文リスト、新規作文作成
- 中央パネル: 作文エディタ、閲覧モード、ふりがなプレビュー、添削表示
- 右パネル: 語彙メモリーバンク、講師サポート、質問管理

主な機能:

- 作文をSupabaseへ保存
- ふりがなプレビュー生成
- 編集モード / 閲覧モード切り替え
- ふりがなON / OFF切り替え
- テキスト選択時のアクションポップオーバー
- 選択語彙の追加
- 追加語彙の読み・意味の自動補助
- 生徒からの質問記録
- 講師返信の保存
- 作文全文の中で添削差分を表示
- 削除箇所は赤字 + 打ち消し線
- 修正後 / 新規追加箇所は緑系ハイライト

### `/workspace?role=student`

生徒用の作文ワークスペースです。

講師Viewとの主な違い:

- 講師サポートパネルではなく、生徒向け復習パネルを表示
- 質問と講師返信を復習用メモとして確認
- 語彙復習を見やすく表示
- 添削差分は確認できるが、講師専用の操作は表示しません

### `/articles?role=teacher`

AI記事生成ワークスペースです。

主な構成:

- 左パネル: 保存済み / 生成済み記事一覧
- 中央パネル: 記事生成プロンプト、JLPTレベル、文体選択、生成記事本文、ふりがな表示
- 右パネル: 記事ごとの語彙リスト

主な機能:

- OpenAIによる日本語読解記事生成
- JLPTレベル選択
- 文体選択: 自然、会話寄り、ビジネス寄り
- ふりがなON / OFF切り替え
- 記事本文のテキスト選択
- 選択テキストへのアクションポップオーバー
- 選択語彙の語彙リスト追加
- 生成記事のSupabase保存

### `/articles?role=student`

生徒用の記事閲覧画面です。

- 講師Viewと近い読解レイアウト
- 生徒向けの表示に調整
- 会話練習の質問は生徒Viewでは非表示
- ふりがな表示に対応

### `/vocabulary?role=student`

語彙テスト / 語彙復習ワークスペースです。

主なモード:

- AIクイズ生成
- 単語帳テスト準備
- 単語帳テスト実行
- 例文作成
- テスト結果表示

主な機能:

- 作文や生成記事から蓄積された語彙をテスト対象として選択
- テスト前に語彙、意味、読みを確認
- 意味を自由記述で入力
- OpenAIで回答を「正解」「おしい」「不正解」に判定
- 判定後に1文程度の例文を作成
- 作成した例文を語彙レコードへ反映
- 語彙テストのセッションと回答履歴をSupabaseへ保存

## データモデル概要

Supabaseのスキーマと型定義は以下にあります。

- `supabase/schema.sql`
- `src/lib/supabase/types.ts`

主なテーブル:

- `profiles`
- `students`
- `teacher_students`
- `writings`
- `corrections`
- `articles`
- `vocabulary_items`
- `article_vocabulary_items`
- `questions`
- `vocabulary_test_sessions`
- `vocabulary_test_results`

現在のMVPでは、以下の固定IDを使っています。

- 講師: `00000000-0000-4000-8000-000000000001`
- 生徒: `00000000-0000-4000-8000-000000000101`

Supabaseのセットアップ詳細やRLSに関する注意は `supabase/README.md` を確認してください。

## 環境変数

`.env.example` をもとに `.env.local` を作成してください。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
```

ローカル開発では、低コスト検証用に以下のようなモデル設定を想定しています。

```env
OPENAI_MODEL=gpt-5.4-nano
```

`.env.local` や実際のAPIキーは絶対にGitにコミットしないでください。

## ローカル開発

依存関係をインストールします。

```bash
npm install
```

開発サーバーを起動します。

```bash
PORT=3001 npm run dev
```

ブラウザで開きます。

```text
http://localhost:3001/
```

よく使う確認URL:

```text
http://localhost:3001/dashboard?role=teacher
http://localhost:3001/dashboard?role=student
http://localhost:3001/workspace?role=teacher
http://localhost:3001/workspace?role=student
http://localhost:3001/articles?role=teacher
http://localhost:3001/articles?role=student
http://localhost:3001/vocabulary?role=student
```

## 動作確認

Lintを実行します。

```bash
npm run lint
```

本番ビルドを確認します。

```bash
npm run build
```

## Supabaseセットアップ

1. Supabaseプロジェクトを作成、または既存プロジェクトを開きます。
2. `.env.local` にSupabase URLとanon keyを設定します。
3. `supabase/schema.sql` のSQLをSupabase SQL Editorで実行します。
4. 固定の講師・生徒seedデータが作成されていることを確認します。
5. MVP用の緩いポリシーを使っている間は、アプリを限定的な開発環境として扱います。

重要なセキュリティ注意:

現在のスキーマには、ローカル / プライベート検証向けのMVP用アクセスポリシーが含まれています。実際の生徒が使う前に、Supabase Authと厳密なRow Level Securityへ置き換えてください。

- 講師は担当生徒のデータだけにアクセスできるようにする
- 生徒は自分自身のデータだけにアクセスできるようにする
- 講師専用のサポート情報は、明示的に共有しない限り生徒に見せない

## OpenAIの利用箇所

OpenAIは現在、以下の機能で使っています。

- 記事生成
- 語彙の意味説明
- 語彙テストの回答判定

OpenAI APIキーがブラウザに露出しないよう、呼び出しはサーバー側APIルートを経由しています。

関連ファイル:

- `app/api/ai/generate-article/route.ts`
- `app/api/ai/explain-vocabulary/route.ts`
- `app/api/ai/judge-vocabulary/route.ts`

## ふりがな生成

ふりがなは、サーバー側で形態素解析を行って生成します。

関連ファイル:

- `app/api/furigana/route.ts`
- `src/lib/furigana-server.ts`
- `src/lib/furigana-client.ts`
- `src/lib/furigana.ts`

クライアント側にはUIを安定させるためのフォールバック処理も残していますが、基本的にはサーバー側の解析結果を使う想定です。

## 現在の制限事項

- ログインUIはまだ本物の認証ではありません
- 講師 / 生徒の切り替えはURLクエリで制御しています
- MVP全体で固定の講師ID・生徒IDを使っています
- Supabaseデータが取得できない場合、一部ローカルフォールバックデータを使います
- Google Sheet / Google Calendar連携はまだ未実装です
- Supabase RLSは本番レベルではありません
- まだ公開本番サービスとしてのデプロイは行っていません

## 今後予定しているGoogle Sheet連携

想定している将来フロー:

```text
Google Sheet
  -> Apps Script
  -> Supabase Edge Function
  -> Supabase DB
  -> Nihongo Palette
```

連携対象:

- 生徒ログ: 生徒名、表示名、Gmail、レッスン料金
- マスターログ: レッスン日時、生徒名、Google Calendarイベント参照

推奨するバックエンド構成は、秘密のsync tokenを持つSupabase Edge Function経由です。Apps Scriptに広範囲なDB資格情報を直接持たせない方針です。

## 開発者向けメモ

- 生成フォルダはGitに入れない: `.next`, `.next-dev`, `node_modules`, `dist`, `out`
- ローカル秘密情報はGitに入れない: `.env.local`, 実際のSupabaseキー, OpenAIキー
- UI変更時は、既存コンポーネントと `app/globals.css` の色・トーンを優先する
- 本ログインを入れる場合は、必ずSupabase RLS設計も同時に見直す
- Next.jsの挙動を変更する場合は、`node_modules/next/dist/docs/` 以下のローカルドキュメントを確認する

## ライセンス

Private project. 公開リポジトリとして運用する場合は、ライセンス方針を決めてから `LICENSE` を追加してください。
