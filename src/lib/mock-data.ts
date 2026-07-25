import type { Article, Correction, Student, VocabularyItem, Writing } from "@/lib/types";

export const students: Student[] = [
  {
    id: "student-1",
    name: "Emma Johnson",
    level: "N4",
    interest: "旅行とカフェ",
    nextLessonFocus: "過去形で週末の出来事を話す",
  },
  {
    id: "student-2",
    name: "Miguel Santos",
    level: "N3",
    interest: "音楽と仕事の会話",
    nextLessonFocus: "理由を説明する表現を増やす",
  },
  {
    id: "student-3",
    name: "Ava Smith",
    level: "N5",
    interest: "アニメと日常会話",
    nextLessonFocus: "助詞「で」「に」の使い分け",
  },
];

export const writings: Writing[] = [
  {
    id: "writing-1",
    studentId: "student-1",
    title: "週末の旅行",
    draft:
      "先週の土曜日、友だちと鎌倉へ行きました。海を見て、お寺を見ました。とても楽しかったです。",
    furiganaPreview:
      "先週(せんしゅう)の土曜日(どようび)、友(とも)だちと鎌倉(かまくら)へ行(い)きました。",
    updatedAt: "2026-05-05",
  },
  {
    id: "writing-2",
    studentId: "student-2",
    title: "私の仕事",
    draft:
      "私は会社でデザインの仕事をしています。毎日チームと話して、新しいアイデアを考えます。",
    furiganaPreview:
      "私(わたし)は会社(かいしゃ)でデザインの仕事(しごと)をしています。",
    updatedAt: "2026-05-04",
  },
];

export const corrections: Correction[] = [
  {
    id: "correction-1",
    writingId: "writing-1",
    before: "海を見て、お寺を見ました。",
    after: "海を見たり、お寺を見たりしました。",
    note: "複数の活動を自然に並べる練習。",
  },
  {
    id: "correction-2",
    writingId: "writing-1",
    before: "とても楽しかったです。",
    after: "とても楽しい一日でした。",
    note: "文章の締め方を少し自然にする。",
  },
];

export const vocabulary: VocabularyItem[] = [
  {
    id: "vocab-1",
    studentId: "student-1",
    word: "鎌倉",
    reading: "かまくら",
    meaning: "a city near Tokyo with temples and the sea",
    example: "週末に鎌倉へ行きました。",
  },
  {
    id: "vocab-2",
    studentId: "student-1",
    word: "お寺",
    reading: "おてら",
    meaning: "temple",
    example: "古いお寺を見ました。",
  },
  {
    id: "vocab-3",
    studentId: "student-2",
    word: "考える",
    reading: "かんがえる",
    meaning: "to think",
    example: "新しいアイデアを考えます。",
  },
];

export const articles: Article[] = [
  {
    id: "article-1",
    studentId: "student-1",
    level: "N4",
    topic: "旅行",
    title: "小さい旅の楽しみ",
  },
  {
    id: "article-2",
    studentId: "student-2",
    level: "N3",
    topic: "仕事",
    title: "チームで働くこと",
  },
];

export const lessonCounts = [
  { day: "Mon", count: 3 },
  { day: "Tue", count: 5 },
  { day: "Wed", count: 4 },
  { day: "Thu", count: 6 },
  { day: "Fri", count: 3 },
  { day: "Sat", count: 2 },
  { day: "Sun", count: 4 },
];
