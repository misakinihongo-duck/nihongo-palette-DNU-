export type Role = "teacher" | "student";

export type Student = {
  id: string;
  name: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  interest: string;
  nextLessonFocus: string;
};

export type Writing = {
  id: string;
  studentId: string;
  title: string;
  draft: string;
  furiganaPreview: string;
  updatedAt: string;
};

export type Correction = {
  id: string;
  writingId: string;
  before: string;
  after: string;
  note: string;
};

export type WorkspaceCorrection = Correction & {
  createdAt: string;
};

export type VocabularyItem = {
  id: string;
  studentId: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
};

export type WorkspaceVocabularyItem = VocabularyItem & {
  writingId?: string;
  sourceSentence?: string;
  createdAt?: string;
};

export type WorkspaceQuestionEntry = {
  id: string;
  writingId: string;
  speaker: "student" | "teacher";
  label: string;
  body: string;
  selectedText: string;
  selectedSentence: string;
  createdAt: string;
};

export type Article = {
  id: string;
  studentId: string;
  level: Student["level"];
  topic: string;
  title: string;
};
