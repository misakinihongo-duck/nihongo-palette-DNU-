import { ArticleGeneratorClient } from "@/components/articles/ArticleGeneratorClient";
import { AppShell } from "@/components/layout/AppShell";
import { getRole } from "@/lib/role";

type ArticlesPageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const role = getRole(params?.role);

  return (
    <AppShell
      role={role}
      title={role === "teacher" ? "記事生成" : "読解記事"}
      variant="workspace"
      description={
        role === "teacher"
          ? "生徒のレベルと興味に合わせて、短い読解記事と語彙リストを準備します。"
          : "先生が用意したレベル別の記事を読み、語彙と質問を確認します。"
      }
    >
      <ArticleGeneratorClient role={role} />
    </AppShell>
  );
}
