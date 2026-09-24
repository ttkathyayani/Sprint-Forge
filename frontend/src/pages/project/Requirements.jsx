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
        <h1 className="font-display text-3xl font-bold text-[#2A352C] flex items-center gap-2">
          <ListChecks className="w-7 h-7 text-[#56654E]" /> Extracted Requirements
        </h1>
        <p className="text-[#636C61] mt-1">Atomic requirements identified from your SRS by the AI.</p>
      </div>

      {isLoading ? null : reqs.length === 0 ? (
        <div className="border border-dashed border-[#EADBCC] bg-white/60 rounded-3xl py-16 text-center text-[#636C61]">
          No requirements yet. Process an SRS first.
        </div>
      ) : (
        <div className="space-y-2.5">
          {reqs.map((r, i) => (
            <div key={r.id} data-testid={`requirement-${i}`}
              className="flex items-start gap-3 bg-white border border-[#EADBCC] rounded-2xl px-4 py-3.5 shadow-xs">
              <span className="font-mono text-xs font-semibold text-[#56654E] bg-[#EAF0E9] border border-[#C8D6C7] rounded-lg px-2 py-0.5 mt-0.5 shrink-0">
                R{String(i + 1).padStart(2, "0")}
              </span>
              <FileText className="w-4 h-4 text-[#7A8377] mt-1 shrink-0" />
              <p className="text-sm text-[#2A352C] flex-1 leading-relaxed">{r.text}</p>
              <span className="text-xs text-[#7A8377] font-mono shrink-0 px-2 py-0.5 rounded bg-[#FAF7F0] border border-[#EADBCC]">{r.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
