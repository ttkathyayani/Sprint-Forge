export const PRIORITY = {
  Critical: { badge: "bg-[#FDE8E8] text-[#9B1C1C] border-[#F8B4B4]", stripe: "bg-[#F87171]" },
  High: { badge: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]", stripe: "bg-[#F59E0B]" },
  Medium: { badge: "bg-[#E6EEF6] text-[#2B486E] border-[#B5CCE2]", stripe: "bg-[#9EB8D9]" },
  Low: { badge: "bg-[#EAF4E8] text-[#2E5524] border-[#C5E1A5]", stripe: "bg-[#A4CB82]" },
};

export const TYPE_STYLE = {
  epic: "bg-[#F2ECFA] text-[#513279] border-[#DDD0F7]",
  story: "bg-[#F2EBFA] text-[#4B2A7E] border-[#D8C7F5]",
  task: "bg-[#E6F5F9] text-[#1C5465] border-[#BCE3EB]",
};

export function utilColor(pct) {
  if (pct > 100) return "text-rose-600";
  if (pct >= 85) return "text-amber-700";
  return "text-[#2E5524]";
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

