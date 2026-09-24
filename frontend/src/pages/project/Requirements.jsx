import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, FileText } from "lucide-react";
import api from "@/lib/api";

export default function Requirements() {
  const { pid } = useParams();
  const { data: reqs = [], isLoading } = useQuery({
    queryKey: ["requirements", pid],
    queryFn: () => api.get(`/projects/${pid}/requirements`).then((r) => r.data),
  });

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#252830] flex items-center gap-2">
          <ListChecks className="w-7 h-7 text-[#552F8E]" /> Extracted Requirements
        </h1>
        <p className="text-[#6D7584] mt-1">Atomic requirements identified from your SRS by the AI.</p>
      </div>

      {isLoading ? null : reqs.length === 0 ? (
        <div className="border border-dashed border-[#E8E2D7] bg-white/60 rounded-3xl py-16 text-center text-[#6D7584]">
          No requirements yet. Process an SRS first.
        </div>
      ) : (
        <div className="space-y-2.5">
          {reqs.map((r, i) => (
            <div key={r.id} data-testid={`requirement-${i}`}
              className="flex items-start gap-3 bg-white border border-[#E8E2D7] rounded-2xl px-4 py-3.5 shadow-xs">
              <span className="font-mono text-xs font-semibold text-[#552F8E] bg-[#F2EBFA] border border-[#D8C7F5] rounded-lg px-2 py-0.5 mt-0.5 shrink-0">
                R{String(i + 1).padStart(2, "0")}
              </span>
              <FileText className="w-4 h-4 text-[#8A92A0] mt-1 shrink-0" />
              <p className="text-sm text-[#252830] flex-1 leading-relaxed">{r.text}</p>
              <span className="text-xs text-[#8A92A0] font-mono shrink-0 px-2 py-0.5 rounded bg-[#FAF8F4] border border-[#E8E2D7]">{r.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
