import { AppShell } from "@/components/layout/AppShell";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { getRole } from "@/lib/role";

type DashboardPageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const role = getRole(params?.role);

  return (
    <AppShell
      role={role}
      title={role === "teacher" ? "講師ダッシュボード" : "生徒ダッシュボード"}
      description={
        role === "teacher"
          ? "担当生徒と最近の学習素材を確認し、作文ワークスペースへ移動します。"
          : "自分の作文、語彙、記事を確認し、レッスン後の復習に進みます。"
      }
    >
      {role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
    </AppShell>
  );
}
