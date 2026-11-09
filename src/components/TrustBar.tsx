/**
 * TrustBar (DESIGN.md → stats-card-tinted, badge-neutral).
 * Light-band stats row sitting directly under the dark hero. Stats live in
 * pastel-tinted tiles — soft washes of Torq Blue / Torq Yellow so the
 * (black-text) tiles stay legible without pulling in the vivid brand hues
 * used for the gradient and CTAs.
 */

const stats: {
  value: string;
  label: string;
  tint: "mint" | "periwinkle" | "peach" | "neutral";
}[] = [
  { value: "40%", label: "Lower cost vs. local-only hire", tint: "mint" },
  { value: "100%", label: "On-time milestone delivery", tint: "periwinkle" },
  { value: "50+", label: "Production launches shipped", tint: "peach" },
  { value: "24h", label: "Average first-reply window", tint: "neutral" },
];

const regions = ["Americas", "Europe", "Middle East", "Asia", "Africa"];

function tintClass(t: (typeof stats)[number]["tint"]) {
  switch (t) {
    case "mint":
      return "bg-[#fff3c4]";
    case "periwinkle":
      return "bg-[#dce9fb]";
    case "peach":
      return "bg-[#b8cff0]";
    default:
      return "bg-[var(--app-muted)] text-[var(--app-fg)]";
  }
}

export default function TrustBar() {
  return (
    <section
      className="band-light border-t border-b border-hairline"
      aria-label="Results and reach"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-[80px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="mono-eyebrow text-muted-foreground">RESULTS · WORLDWIDE</p>
          <p className="display-md max-w-xl text-foreground">
            Numbers we hear back from clients after launch.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <li
              key={s.label}
              className={`flex h-full flex-col justify-between gap-6 rounded-[var(--radius-sm)] p-7 text-black ${tintClass(s.tint)}`}
            >
              <p className="stat-number text-[40px] leading-none tracking-[-0.03em]">{s.value}</p>
              <p className="mono-label opacity-80">{s.label}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-eyebrow text-muted-foreground">TRUSTED IN</p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] tracking-tight text-foreground/85">
            {regions.map((region) => (
              <li key={region}>{region}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
