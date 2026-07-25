import { lessonCounts } from "@/lib/mock-data";

export function LessonChart() {
  const maxCount = Math.max(...lessonCounts.map((item) => item.count));

  return (
    <div className="rounded-[30px] bg-white p-5 shadow-[0_18px_48px_rgba(47,136,197,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#2F88C5]">Lesson rhythm</p>
          <h2 className="mt-1 text-xl font-bold text-[#2F3337]">日々のレッスン数</h2>
        </div>
        <span className="rounded-full bg-[#DDF4FA] px-3 py-1 text-xs font-bold text-[#2F88C5]">
          7 days
        </span>
      </div>

      <div className="mt-6 flex h-40 items-end gap-3 rounded-[24px] bg-[#F7FCFF] px-4 pb-4 pt-6">
        {lessonCounts.map((item) => (
          <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="mini-chart-bar w-full min-w-5"
              style={{ height: `${Math.max((item.count / maxCount) * 100, 18)}%` }}
              title={`${item.day}: ${item.count}`}
            />
            <span className="text-xs font-bold text-[#6F7F8A]">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
