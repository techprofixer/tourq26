"use client";

import type { Option } from "@/lib/business-systems/options";

/** Large-touch-target selectable cards — single or multi select. Same visual language as the
 * site's other black/white active states (e.g. AdminSidebar's active nav item). */
function OptionButton({
  option,
  selected,
  onClick,
}: {
  option: Option;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[52px] rounded-[4px] border px-4 py-3 text-left text-[15px] transition-colors ${
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-hairline text-foreground hover:border-foreground/50"
      }`}
    >
      {option.label}
    </button>
  );
}

export function SingleSelectGrid({
  options,
  value,
  onChange,
}: {
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => (
        <OptionButton key={o.value} option={o} selected={value === o.value} onClick={() => onChange(o.value)} />
      ))}
    </div>
  );
}

export function MultiSelectGrid({
  options,
  values,
  onChange,
}: {
  options: readonly Option[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => (
        <OptionButton key={o.value} option={o} selected={values.includes(o.value)} onClick={() => toggle(o.value)} />
      ))}
    </div>
  );
}
