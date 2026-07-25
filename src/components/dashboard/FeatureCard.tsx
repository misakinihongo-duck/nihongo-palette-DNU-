import { ButtonLink } from "@/components/ui/ButtonLink";

type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
  kind: "writing" | "vocabulary" | "article";
  accent: "blue" | "pink" | "orange";
};

const accentStyles = {
  blue: "from-[#DDF4FA] to-[#F7FCFF] text-[#2F88C5]",
  pink: "from-[#FFE7E3] to-[#F7FCFF] text-[#D36F65]",
  orange: "from-[#FFE7D6] to-[#F7FCFF] text-[#D97430]",
};

export function FeatureCard({
  title,
  description,
  href,
  kind,
  accent,
}: FeatureCardProps) {
  return (
    <article className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${accentStyles[accent]} p-5 shadow-[0_18px_44px_rgba(47,136,197,0.12)]`}>
      <FeatureSketch kind={kind} />
      <div className="relative z-10 max-w-[78%]">
        <p className="text-xs font-bold uppercase tracking-wide opacity-70">Feature</p>
        <h3 className="mt-2 text-2xl font-bold text-[#2F3337]">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#6F7F8A]">{description}</p>
        <div className="mt-5">
          <ButtonLink href={href} variant="ghost">
            開く
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

function FeatureSketch({ kind }: { kind: FeatureCardProps["kind"] }) {
  if (kind === "writing") {
    return (
      <div className="absolute -right-5 bottom-4 h-32 w-36 rotate-[-6deg] rounded-[26px] border-4 border-[#5DB6DE]/35 bg-white/45 p-5 opacity-70">
        <span className="block h-2 rounded-full bg-[#5DB6DE]/45" />
        <span className="mt-4 block h-2 w-20 rounded-full bg-[#5DB6DE]/35" />
        <span className="mt-3 block h-2 w-24 rounded-full bg-[#5DB6DE]/25" />
        <span className="absolute bottom-4 right-5 text-4xl font-bold text-[#5DB6DE]/35">あ</span>
      </div>
    );
  }

  if (kind === "vocabulary") {
    return (
      <div className="absolute -right-4 bottom-3 grid h-32 w-36 rotate-3 gap-2 opacity-70">
        {["漢字", "読む", "話す"].map((word) => (
          <span
            key={word}
            className="rounded-2xl border-2 border-[#F7B7AD]/45 bg-white/48 px-4 py-2 text-sm font-bold text-[#D36F65]/70"
          >
            {word}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute -right-5 bottom-5 h-32 w-40 rotate-6 opacity-70">
      <div className="absolute bottom-0 h-24 w-28 rounded-lg bg-[#F28A4B]/58" />
      <div className="absolute bottom-4 left-4 h-24 w-28 rounded-lg border-2 border-[#5DB6DE]/45 bg-white/55" />
      <span className="absolute left-8 top-8 h-2 w-20 rounded-full bg-[#5DB6DE]/40" />
      <span className="absolute left-8 top-14 h-2 w-14 rounded-full bg-[#5DB6DE]/30" />
    </div>
  );
}
