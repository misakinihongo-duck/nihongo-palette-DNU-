import type { FuriganaSegment } from "@/lib/furigana";

export type LocalArticleVocabulary = {
  id?: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
};

export type LocalSavedArticle = {
  id: string;
  title: string;
  body: string;
  furiganaSegments: FuriganaSegment[];
  level: string;
  topic: string;
  tone: string;
  length: string;
  createdAt: string;
  vocabulary: LocalArticleVocabulary[];
  questions: string[];
  isSaved: boolean;
};

const LOCAL_ARTICLE_STORAGE_KEY = "nihongo-palette-saved-articles";

export function readLocalSavedArticles(): LocalSavedArticle[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedValue = window.localStorage.getItem(LOCAL_ARTICLE_STORAGE_KEY);

    if (!savedValue) {
      return [];
    }

    const parsedValue = JSON.parse(savedValue);

    return Array.isArray(parsedValue) ? parsedValue.filter(isLocalSavedArticle) : [];
  } catch {
    return [];
  }
}

export function upsertLocalSavedArticle(article: LocalSavedArticle) {
  if (typeof window === "undefined") {
    return;
  }

  const nextArticles = upsertLocalSavedArticleList(readLocalSavedArticles(), article);
  window.localStorage.setItem(LOCAL_ARTICLE_STORAGE_KEY, JSON.stringify(nextArticles));
}

export function upsertLocalSavedArticleList(
  articles: LocalSavedArticle[],
  nextArticle: LocalSavedArticle
) {
  return [nextArticle, ...articles.filter((article) => article.id !== nextArticle.id)];
}

export function updateLocalArticleVocabularyExample({
  articleId,
  example,
  vocabularyId,
}: {
  articleId: string;
  example: string;
  vocabularyId: string;
}) {
  if (typeof window === "undefined") {
    return false;
  }

  const articles = readLocalSavedArticles();
  let didUpdate = false;
  const nextArticles = articles.map((article) => {
    if (article.id !== articleId) {
      return article;
    }

    return {
      ...article,
      vocabulary: article.vocabulary.map((item) => {
        if (item.id !== vocabularyId) {
          return item;
        }

        didUpdate = true;
        return { ...item, example };
      }),
    };
  });

  if (didUpdate) {
    window.localStorage.setItem(LOCAL_ARTICLE_STORAGE_KEY, JSON.stringify(nextArticles));
  }

  return didUpdate;
}

function isLocalSavedArticle(value: unknown): value is LocalSavedArticle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const article = value as Partial<LocalSavedArticle>;

  return Boolean(article.id && article.title && article.body && Array.isArray(article.vocabulary));
}
