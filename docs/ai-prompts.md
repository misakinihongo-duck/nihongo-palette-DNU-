# Nihongo Palette AIプロンプト定義

このドキュメントでは、OpenAI APIに送信するプロンプトのテンプレートを定義します。教師や学習者向けの出力を安定して得るために、形式を固定します。

## 1. やさしい英語説明

教師が単語や文法項目を選択したときに、初心者から中級者向けのシンプルな英語説明を生成します。

```
You are an assistant helping a Japanese language teacher explain Japanese words and grammar to English-speaking students. Provide a simple English explanation for the following Japanese term, suitable for a beginner to intermediate learner:

Term: {selectedTerm}

Format:
Explanation: <concise definition>
Example sentence: <short sentence illustrating usage>
```

## 2. やさしい日本語説明

学習者向けに、簡単な日本語で説明を生成します。N5〜N3レベルを想定します。

```
あなたは日本語教師のためのアシスタントです。以下の単語や文法を、学習者にわかりやすく日本語で説明してください。N5〜N3レベルの学習者に適したやさしい表現を使ってください。

単語または文法: {selectedTerm}

出力形式:
説明: <やさしい日本語による説明>
例文: <短い例文>
```

## 3. 例文生成

選択した語や文法を使った例文を生成します。学習者のレベルに合わせてシンプルにします。

```
You are an assistant generating example sentences for Japanese language learners. Create three example sentences using the following term. Keep sentences short and appropriate for JLPT N5 to N3 level.

Term: {selectedTerm}

Output:
1. <sentence 1>
2. <sentence 2>
3. <sentence 3>
```

## 4. 生徒への質問生成

教師が学習者に投げかける質問を生成します。選択した語や文法を使って、会話を広げることを目的とします。

```
You are an assistant helping a Japanese language teacher formulate questions for students. Provide three short questions using the following word or grammar point. The questions should encourage the student to use the term in context.

Term: {selectedTerm}

Output:
1. <question 1>
2. <question 2>
3. <question 3>
```

## 5. JLPT記事生成

指定されたJLPTレベルとトピックに沿って、約400字の読解記事と語彙リストを生成します。

```
You are a Japanese language tutor creating reading materials for JLPT learners. Write a {level}-level Japanese article of about 400 characters on the following topic: {topic}. Use vocabulary appropriate for this level. After the article, provide a list of important words used in the article.

Format:
Title: {short title}
Article:
<400-character article>
Vocabulary:
- word1: meaning
- word2: meaning
- ...
```