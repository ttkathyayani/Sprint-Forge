export const PRIORITY = {
  Critical: { badge: "bg-[#FAEDE8] text-[#933718] border-[#F4C9BA]", stripe: "bg-[#C44D26]" },
  High: { badge: "bg-[#FAF0E9] text-[#A65B3A] border-[#F1D6C7]", stripe: "bg-[#CD7A56]" },
  Medium: { badge: "bg-[#F7F2E9] text-[#7A6448] border-[#EADBCC]", stripe: "bg-[#BC8466]" },
  Low: { badge: "bg-[#EDF3EB] text-[#455740] border-[#D1DEC9]", stripe: "bg-[#7D8D72]" },
};

export const TYPE_STYLE = {
  epic: "bg-[#EAF0E9] text-[#2B3B2E] border-[#C8D6C7]",
  story: "bg-[#FAF0E9] text-[#9C4827] border-[#F1D6C7]",
  task: "bg-[#F7F2E9] text-[#615545] border-[#EADBCC]",
};

export function utilColor(pct) {
  if (pct > 100) return "text-[#B93815]";
  if (pct >= 85) return "text-[#C46E50]";
  return "text-[#455740]";
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
