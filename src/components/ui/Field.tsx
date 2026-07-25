type FieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  rows?: number;
};

export function TextField({ label, value, placeholder }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#2F3337]">
      {label}
      <input
        className="min-h-12 rounded-2xl border border-[#CDEBF5] bg-[#F7FCFF] px-4 text-sm text-[#2F3337] outline-none transition placeholder:text-[#9AA9B3] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/20"
        defaultValue={value}
        placeholder={placeholder}
      />
    </label>
  );
}

export function TextArea({ label, value, placeholder, rows = 8 }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#2F3337]">
      {label}
      <textarea
        className="w-full resize-none rounded-[24px] border border-[#CDEBF5] bg-[#F7FCFF] px-4 py-4 text-base leading-8 text-[#2F3337] outline-none transition placeholder:text-[#9AA9B3] focus:border-[#5DB6DE] focus:ring-4 focus:ring-[#5DB6DE]/20"
        defaultValue={value}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}
