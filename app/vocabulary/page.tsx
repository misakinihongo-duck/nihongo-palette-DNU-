import { AppShell } from "@/components/layout/AppShell";
import { VocabularyQuizClient } from "@/components/vocabulary/VocabularyQuizClient";
import { getRole } from "@/lib/role";

type VocabularyPageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function VocabularyPage({ searchParams }: VocabularyPageProps) {
  const params = await searchParams;
  const role = getRole(params?.role);

  return (
    <AppShell
      role={role}
      title={role === "teacher" ? "語彙テスト" : "語彙復習"}
      variant="workspace"
      description={
        role === "teacher"
          ? "作文や記事から蓄積された語彙を選び、意味確認と1行作文につなげます。"
          : "レッスンで出会った単語を、意味と短い文で復習します。"
      }
    >
      <VocabularyQuizClient role={role} />
    </AppShell>
  );
}
