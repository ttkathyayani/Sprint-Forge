import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wand2, Loader2, Zap, Gauge, Scale, Target, Sparkles, GitBranch, AlertTriangle } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { PRIORITY, utilColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const METRIC_CARDS = [
  { key: "capacity_utilization", label: "Capacity Utilization", icon: Gauge, suffix: "%" },
  { key: "workload_balance", label: "Workload Balance", icon: Scale, suffix: "%" },
  { key: "skill_match", label: "Skill Match", icon: Sparkles, suffix: "%" },
  { key: "priority_satisfaction", label: "Priority Satisfaction", icon: Target, suffix: "%" },
  { key: "dependency_satisfaction", label: "Dependency Valid", icon: GitBranch, suffix: "%" },
  { key: "overload_rate", label: "Overload Rate", icon: AlertTriangle, suffix: "%" },
];

export default function SprintPlanning() {
  const { pid } = useParams();
  const qc = useQueryClient();

  const { data: sprint, isLoading } = useQuery({
    queryKey: ["sprint", pid],
    queryFn: () => api.get(`/projects/${pid}/sprint`).then((r) => r.data),
  });

  const plan = useMutation({
    mutationFn: () => api.post(`/projects/${pid}/plan`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sprint", pid] }); qc.invalidateQueries({ queryKey: ["backlog", pid] }); toast.success("Optimized sprint plan generated"); },
    onError: (e) => toast.error(apiError(e)),
  });

  const p = sprint?.plan;

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-7 h-7 text-indigo-400" /> Sprint Planning
          </h1>
          <p className="text-zinc-500 mt-1">Capacity, skill and dependency-aware optimization across the team.</p>
        </div>
        <Button onClick={() => plan.mutate()} disabled={plan.isPending} data-testid="generate-sprint-plan-button"
          className="bg-indigo-600 hover:bg-indigo-500 text-white">
          {plan.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Optimizing…</> : <><Zap className="w-4 h-4 mr-1" /> Generate optimized plan</>}
        </Button>
      </div>

      {isLoading ? null : !sprint ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl py-16 text-center text-zinc-500">
          No sprint planned yet. Approve backlog items, add developers, then generate a plan.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
            <div>
              <p className="text-xs font-mono uppercase text-zinc-500">Sprint capacity</p>
              <p className="text-3xl font-display font-bold text-white">{p.selected_points}<span className="text-zinc-600 text-xl"> / {p.capacity} pts</span></p>
            </div>
            <div className="flex-1"><Progress value={Math.min(100, p.selected_points / p.capacity * 100)} className="h-2 bg-zinc-800" /></div>
            <div className="text-right">
              <p className="text-xs font-mono uppercase text-zinc-500">Scheduled</p>
              <p className="text-3xl font-display font-bold text-white">{p.assignments.length}<span className="text-zinc-600 text-xl"> / {p.pool_size}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" data-testid="plan-metrics">
            {METRIC_CARDS.map((m) => {
              const v = sprint.metrics[m.key];
              const good = m.key === "overload_rate" ? v === 0 : v >= 70;
              return (
                <div key={m.key} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-zinc-500 text-sm"><m.icon className="w-4 h-4" /> {m.label}</div>
                  <p className={`text-3xl font-display font-bold mt-2 ${good ? "text-emerald-400" : "text-amber-400"}`}>{v}{m.suffix}</p>
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-white mb-3">Developer workload</h2>
            <div className="space-y-3">
              {p.dev_loads.map((d) => (
                <div key={d.developer_id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4" data-testid={`load-${d.developer_id}`}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">{d.name}</span>
                    <span className={`font-mono ${utilColor(d.utilization)}`}>{d.load} / {d.capacity} pts · {d.utilization}%</span>
                  </div>
                  <Progress value={Math.min(100, d.utilization)} className="h-2 bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-white mb-3">Assignments</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {p.assignments.map((a) => {
                const pr = PRIORITY[a.priority] || PRIORITY.Medium;
                return (
                  <div key={a.item_id} className="relative bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 pl-5 overflow-hidden" data-testid={`assignment-${a.item_id}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${pr.stripe}`} />
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">→ {a.developer_name} · skill match {Math.round(a.skill_score * 100)}%</p>
                      </div>
                      <span className="font-mono text-indigo-300 shrink-0">{a.story_points}pt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {p.unscheduled.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-zinc-400 mb-2">Deferred (out of capacity)</h2>
              <div className="flex flex-wrap gap-2">
                {p.unscheduled.map((u) => (
                  <span key={u.item_id} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500">
                    {u.title} · {u.story_points}pt
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
