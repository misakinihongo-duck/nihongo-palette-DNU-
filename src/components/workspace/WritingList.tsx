import { students, writings } from "@/lib/mock-data";

export function WritingList() {
  return (
    <aside className="rounded-[30px] border border-white/80 bg-[#F7FCFF]/90 p-4 shadow-[0_18px_48px_rgba(47,136,197,0.12)]">
      <h2 className="text-lg font-bold text-[#2F3337]">作文リスト</h2>
      <div className="mt-4 grid gap-3">
        {writings.map((writing) => {
          const student = students.find((item) => item.id === writing.studentId);

          return (
            <button
              key={writing.id}
              className="rounded-[24px] border border-[#CDEBF5] bg-white p-3 text-left shadow-sm transition hover:border-[#5DB6DE]"
              type="button"
            >
              <p className="font-bold text-[#2F3337]">{writing.title}</p>
              <p className="mt-1 text-xs font-bold text-[#2F88C5]">
                {student?.name} ・ {writing.updatedAt}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6F7F8A]">
                {writing.draft}
              </p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
