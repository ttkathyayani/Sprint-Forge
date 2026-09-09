import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kanban, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { PRIORITY, initials } from "@/lib/format";

const COLUMNS = [
  { key: "todo", label: "To Do", color: "text-zinc-400" },
  { key: "in-progress", label: "In Progress", color: "text-amber-400" },
  { key: "done", label: "Done", color: "text-emerald-400" },
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
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          <Kanban className="w-7 h-7 text-indigo-400" /> Sprint Board
        </h1>
        <p className="text-zinc-500 mt-1">Track execution across the current sprint.</p>
      </div>

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mt-10" /> : !sprint ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl py-16 text-center text-zinc-500">
          No active sprint. Generate a plan first.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const cards = assignments.filter((a) => (a.board_status || "todo") === col.key);
            const pts = cards.reduce((s, c) => s + c.story_points, 0);
            return (
              <div key={col.key} data-testid={`kanban-column-${col.key}`}
                className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-3 min-h-[200px]">
                <div className="flex items-center justify-between px-2 py-2">
                  <span className={`font-display font-semibold ${col.color}`}>{col.label}</span>
                  <span className="text-xs font-mono text-zinc-600">{cards.length} · {pts}pt</span>
                </div>
                <div className="space-y-2">
                  {cards.map((a) => {
                    const pr = PRIORITY[a.priority] || PRIORITY.Medium;
                    const idx = ORDER.indexOf(a.board_status || "todo");
                    return (
                      <div key={a.item_id} data-testid={`board-card-${a.item_id}`}
                        className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-4 overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${pr.stripe}`} />
                        <p className="text-sm text-white font-medium">{a.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold">{initials(a.developer_name)}</span>
                            {a.story_points}pt
                          </div>
                          <div className="flex gap-1">
                            <button disabled={idx === 0} onClick={() => move.mutate({ id: a.item_id, board_status: ORDER[idx - 1] })}
                              data-testid={`move-back-${a.item_id}`}
                              className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
                            <button disabled={idx === 2} onClick={() => move.mutate({ id: a.item_id, board_status: ORDER[idx + 1] })}
                              data-testid={`move-fwd-${a.item_id}`}
                              className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {cards.length === 0 && <p className="text-center text-xs text-zinc-700 py-6">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
