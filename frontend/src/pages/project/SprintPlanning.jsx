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
          <h1 className="font-display text-3xl font-bold text-[#2A352C] flex items-center gap-2">
            <Wand2 className="w-7 h-7 text-[#56654E]" /> Sprint Planning
          </h1>
          <p className="text-[#636C61] mt-1">Capacity, skill and dependency-aware optimization across the team.</p>
        </div>
        <Button onClick={() => plan.mutate()} disabled={plan.isPending} data-testid="generate-sprint-plan-button"
          className="bg-[#56654E] hover:bg-[#46543F] text-[#FCF9F3] font-semibold rounded-xl shadow-xs transition-all">
          {plan.isPending ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Optimizing…</> : <><Zap className="w-4 h-4 mr-1.5" /> Generate optimized plan</>}
        </Button>
      </div>

      {isLoading ? null : !sprint ? (
        <div className="border border-dashed border-[#EADBCC] bg-white/60 rounded-3xl py-16 text-center text-[#636C61]">
          No sprint planned yet. Approve backlog items, add developers, then generate a plan.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-6 bg-white border border-[#EADBCC] rounded-3xl p-6 shadow-xs">
            <div>
              <p className="text-xs font-mono uppercase text-[#636C61]">Sprint capacity</p>
              <p className="text-3xl font-display font-bold text-[#2A352C]">{p.selected_points}<span className="text-[#7A8377] text-xl"> / {p.capacity} pts</span></p>
            </div>
            <div className="flex-1">
              <Progress value={Math.min(100, p.selected_points / p.capacity * 100)} className="h-2.5 bg-[#FAF7F0] border border-[#EADBCC]" />
            </div>
            <div className="text-right">
              <p className="text-xs font-mono uppercase text-[#636C61]">Scheduled</p>
              <p className="text-3xl font-display font-bold text-[#2A352C]">{p.assignments.length}<span className="text-[#7A8377] text-xl"> / {p.pool_size}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" data-testid="plan-metrics">
            {METRIC_CARDS.map((m) => {
              const v = sprint.metrics[m.key];
              const good = m.key === "overload_rate" ? v === 0 : v >= 70;
              return (
                <div key={m.key} className="bg-white border border-[#EADBCC] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 text-[#636C61] text-sm"><m.icon className="w-4 h-4 text-[#56654E]" /> {m.label}</div>
                  <p className={`text-3xl font-display font-bold mt-2 ${good ? "text-[#56654E]" : "text-[#CD7A56]"}`}>{v}{m.suffix}</p>
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-[#2A352C] mb-3">Developer workload</h2>
            <div className="space-y-3">
              {p.dev_loads.map((d) => (
                <div key={d.developer_id} className="bg-white border border-[#EADBCC] rounded-2xl p-4 shadow-xs" data-testid={`load-${d.developer_id}`}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#2A352C] font-semibold">{d.name}</span>
                    <span className={`font-mono font-medium ${utilColor(d.utilization)}`}>{d.load} / {d.capacity} pts · {d.utilization}%</span>
                  </div>
                  <Progress value={Math.min(100, d.utilization)} className="h-2 bg-[#FAF7F0] border border-[#EADBCC]" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-[#2A352C] mb-3">Assignments</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {p.assignments.map((a) => {
                const pr = PRIORITY[a.priority] || PRIORITY.Medium;
                return (
                  <div key={a.item_id} className="relative bg-white border border-[#EADBCC] rounded-2xl p-4 pl-5 overflow-hidden shadow-xs" data-testid={`assignment-${a.item_id}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${pr.stripe}`} />
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[#2A352C] text-sm font-semibold truncate">{a.title}</p>
                        <p className="text-xs text-[#636C61] mt-1">→ <span className="font-medium text-[#2A352C]">{a.developer_name}</span> · skill match <span className="text-[#56654E] font-medium">{Math.round(a.skill_score * 100)}%</span></p>
                      </div>
                      <span className="font-mono text-[#56654E] font-bold text-sm shrink-0 bg-[#EAF0E9] border border-[#C8D6C7] px-2 py-0.5 rounded-lg">{a.story_points}pt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {p.unscheduled.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold text-[#636C61] mb-2">Deferred (out of capacity)</h2>
              <div className="flex flex-wrap gap-2">
                {p.unscheduled.map((u) => (
                  <span key={u.item_id} className="text-xs px-3 py-1.5 rounded-xl bg-white border border-[#EADBCC] text-[#636C61] shadow-xs">
                    {u.title} · <span className="font-mono font-medium text-[#2A352C]">{u.story_points}pt</span>
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
