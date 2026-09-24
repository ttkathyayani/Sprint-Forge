import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kanban, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { PRIORITY, initials } from "@/lib/format";

const COLUMNS = [
  { key: "todo", label: "To Do", bg: "bg-[#F7F2E9]", border: "border-[#EADBCC]", text: "text-[#615545]", pill: "bg-[#FAF7F0] text-[#615545] border-[#EADBCC]" },
  { key: "in-progress", label: "In Progress", bg: "bg-[#FAF0E9]", border: "border-[#F1D6C7]", text: "text-[#9C4827]", pill: "bg-[#FAF0E9] text-[#9C4827] border-[#F1D6C7]" },
  { key: "done", label: "Done", bg: "bg-[#EDF3EB]", border: "border-[#C8D6C7]", text: "text-[#344633]", pill: "bg-[#EAF0E9] text-[#344633] border-[#C8D6C7]" },
];
const ORDER = ["todo", "in-progress", "done"];

export default function SprintBoard() {
  const { pid } = useParams();
  const qc = useQueryClient();

  const { data: sprint, isLoading } = useQuery({
    queryKey: ["sprint", pid],
    queryFn: () => api.get(`/projects/${pid}/sprint`).then((r) => r.data),
  });

  const move = useMutation({
    mutationFn: ({ id, board_status }) => api.patch(`/backlog/${id}/board`, { board_status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sprint", pid] }),
  });

  const assignments = sprint?.plan?.assignments || [];

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#2A352C] flex items-center gap-2">
          <Kanban className="w-7 h-7 text-[#56654E]" /> Sprint Board
        </h1>
        <p className="text-[#636C61] mt-1">Track execution across the current sprint.</p>
      </div>

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#56654E] mx-auto mt-10" /> : !sprint ? (
        <div className="border border-dashed border-[#EADBCC] bg-white/60 rounded-3xl py-16 text-center text-[#636C61]">
          No active sprint. Generate a plan first.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {COLUMNS.map((col) => {
            const cards = assignments.filter((a) => (a.board_status || "todo") === col.key);
            const pts = cards.reduce((s, c) => s + c.story_points, 0);
            return (
              <div key={col.key} data-testid={`kanban-column-${col.key}`}
                className={`${col.bg} border ${col.border} rounded-3xl p-4 min-h-[300px] flex flex-col`}>
                <div className="flex items-center justify-between px-2 py-1 mb-3">
                  <span className={`font-display font-bold text-base ${col.text}`}>{col.label}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-lg border font-semibold ${col.pill}`}>
                    {cards.length} · {pts}pt
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {cards.map((a) => {
                    const pr = PRIORITY[a.priority] || PRIORITY.Medium;
                    const idx = ORDER.indexOf(a.board_status || "todo");
                    return (
                      <div key={a.item_id} data-testid={`board-card-${a.item_id}`}
                        className="relative bg-white border border-[#EADBCC] rounded-2xl p-4 pl-4 overflow-hidden shadow-xs hover:border-[#C8D6C7] transition-all">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${pr.stripe}`} />
                        <p className="text-sm text-[#2A352C] font-semibold leading-snug">{a.title}</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F2EDE4]">
                          <div className="flex items-center gap-2 text-xs text-[#636C61]">
                            <span className="w-6 h-6 rounded-full bg-[#EAF0E9] text-[#56654E] border border-[#C8D6C7] flex items-center justify-center text-[10px] font-bold">
                              {initials(a.developer_name)}
                            </span>
                            <span className="font-mono font-medium text-[#2A352C]">{a.story_points}pt</span>
                          </div>
                          <div className="flex gap-1">
                            <button disabled={idx === 0} onClick={() => move.mutate({ id: a.item_id, board_status: ORDER[idx - 1] })}
                              data-testid={`move-back-${a.item_id}`}
                              className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#EADBCC] hover:bg-[#F2EDE4] text-[#636C61] flex items-center justify-center disabled:opacity-30 transition-all">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button disabled={idx === 2} onClick={() => move.mutate({ id: a.item_id, board_status: ORDER[idx + 1] })}
                              data-testid={`move-fwd-${a.item_id}`}
                              className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#EADBCC] hover:bg-[#F2EDE4] text-[#636C61] flex items-center justify-center disabled:opacity-30 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {cards.length === 0 && (
                    <div className="flex-1 flex items-center justify-center py-10 border border-dashed border-[#EADBCC]/60 rounded-2xl">
                      <p className="text-xs text-[#A0A8B4] font-mono">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
