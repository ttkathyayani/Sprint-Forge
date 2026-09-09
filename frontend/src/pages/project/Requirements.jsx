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
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          <ListChecks className="w-7 h-7 text-indigo-400" /> Extracted Requirements
        </h1>
        <p className="text-zinc-500 mt-1">Atomic requirements identified from your SRS by the AI.</p>
      </div>

      {isLoading ? null : reqs.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl py-16 text-center text-zinc-500">
          No requirements yet. Process an SRS first.
        </div>
      ) : (
        <div className="space-y-2">
          {reqs.map((r, i) => (
            <div key={r.id} data-testid={`requirement-${i}`}
              className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="font-mono text-xs text-indigo-400 mt-0.5 w-8 shrink-0">R{String(i + 1).padStart(2, "0")}</span>
              <FileText className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
              <p className="text-sm text-zinc-300 flex-1">{r.text}</p>
              <span className="text-xs text-zinc-600 font-mono shrink-0">{r.source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
