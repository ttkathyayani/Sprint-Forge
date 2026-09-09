export const PRIORITY = {
  Critical: { badge: "bg-rose-500/15 text-rose-400 border-rose-500/30", stripe: "bg-rose-500" },
  High: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/30", stripe: "bg-amber-500" },
  Medium: { badge: "bg-sky-500/15 text-sky-400 border-sky-500/30", stripe: "bg-sky-500" },
  Low: { badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", stripe: "bg-zinc-500" },
};

export const TYPE_STYLE = {
  epic: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  story: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  task: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

export function utilColor(pct) {
  if (pct > 100) return "text-rose-400";
  if (pct >= 85) return "text-amber-400";
  return "text-emerald-400";
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
