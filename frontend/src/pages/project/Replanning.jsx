import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, UserX, Zap, Clock, Ban, Loader2, ArrowRight, Check } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const EVENTS = [
  { key: "developer_unavailable", label: "Developer unavailable", icon: UserX, color: "text-rose-400" },
  { key: "new_requirement", label: "New high-priority requirement", icon: Zap, color: "text-amber-400" },
  { key: "task_delay", label: "Task takes longer", icon: Clock, color: "text-sky-400" },
  { key: "task_blocked", label: "Task blocked", icon: Ban, color: "text-zinc-400" },
];

function PlanSummary({ title, plan, metrics }) {
  return (
    <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs font-mono uppercase text-zinc-500 mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Row l="Scheduled" v={`${plan.assignments.length} / ${plan.pool_size}`} />
        <Row l="Points" v={`${plan.selected_points} / ${plan.capacity}`} />
        <Row l="Skill match" v={`${metrics.skill_match}%`} />
        <Row l="Balance" v={`${metrics.workload_balance}%`} />
        <Row l="Priority sat." v={`${metrics.priority_satisfaction}%`} />
        <Row l="Overload" v={`${metrics.overload_rate}%`} />
      </div>
    </div>
  );
}
const Row = ({ l, v }) => (
  <div className="flex justify-between border-b border-zinc-800/60 pb-1">
    <span className="text-zinc-500">{l}</span><span className="text-white font-mono">{v}</span>
  </div>
);

export default function Replanning() {
  const { pid } = useParams();
  const qc = useQueryClient();
  const [event, setEvent] = useState("developer_unavailable");
  const [params, setParams] = useState({ priority: "High", story_points: 5 });
  const [result, setResult] = useState(null);

  const { data: devs = [] } = useQuery({ queryKey: ["devs", pid], queryFn: () => api.get(`/projects/${pid}/developers`).then((r) => r.data) });
  const { data: backlog = [] } = useQuery({ queryKey: ["backlog", pid], queryFn: () => api.get(`/projects/${pid}/backlog`).then((r) => r.data) });
  const tasks = backlog.filter((b) => b.status === "approved" && (b.type === "task" || b.type === "story"));

  const run = useMutation({
    mutationFn: (apply) => api.post(`/projects/${pid}/replan`, { event, ...params, apply }).then((r) => r.data),
    onSuccess: (data, apply) => {
      setResult(data);
      if (apply) { qc.invalidateQueries({ queryKey: ["sprint", pid] }); toast.success("Revised plan applied to sprint"); }
    },
    onError: (e) => toast.error(apiError(e)),
  });

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-7 h-7 text-cyan-400" /> Dynamic Replanning
        </h1>
        <p className="text-zinc-500 mt-1">Simulate a disruption and let the engine recompute an optimal sprint.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {EVENTS.map((e) => (
          <button key={e.key} onClick={() => { setEvent(e.key); setResult(null); }} data-testid={`event-${e.key}`}
            className={`rounded-2xl border p-4 text-left transition-colors ${event === e.key ? "border-cyan-500/50 bg-cyan-500/5" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"}`}>
            <e.icon className={`w-5 h-5 ${e.color}`} />
            <p className="text-sm text-white font-medium mt-2 leading-tight">{e.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
        {event === "developer_unavailable" && (
          <div className="space-y-2 max-w-sm">
            <Label>Which developer?</Label>
            <Select value={params.developer_id} onValueChange={(v) => setParams({ developer_id: v })}>
              <SelectTrigger data-testid="replan-dev-select" className="bg-zinc-950 border-zinc-800"><SelectValue placeholder="Select developer" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {devs.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {event === "new_requirement" && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-2 sm:col-span-2"><Label>Requirement title</Label>
              <Input value={params.title || ""} onChange={(e) => setParams({ ...params, title: e.target.value })} data-testid="replan-title-input" placeholder="Urgent: SSO login" className="bg-zinc-950 border-zinc-800" /></div>
            <div className="space-y-2"><Label>Story points</Label>
              <Input type="number" value={params.story_points} onChange={(e) => setParams({ ...params, story_points: Number(e.target.value) })} data-testid="replan-points-input" className="bg-zinc-950 border-zinc-800" /></div>
          </div>
        )}
        {(event === "task_delay" || event === "task_blocked") && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Which task?</Label>
              <Select value={params.item_id} onValueChange={(v) => setParams({ ...params, item_id: v })}>
                <SelectTrigger data-testid="replan-task-select" className="bg-zinc-950 border-zinc-800"><SelectValue placeholder="Select task" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-64">
                  {tasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {event === "task_delay" && (
              <div className="space-y-2"><Label>Actual effort (points)</Label>
                <Input type="number" value={params.actual_points || 8} onChange={(e) => setParams({ ...params, actual_points: Number(e.target.value) })} data-testid="replan-actual-input" className="bg-zinc-950 border-zinc-800" /></div>
            )}
          </div>
        )}
        <Button onClick={() => run.mutate(false)} disabled={run.isPending} data-testid="trigger-replan-btn"
          className="bg-cyan-600 hover:bg-cyan-500 text-white">
          {run.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Recalculating…</> : <><RefreshCw className="w-4 h-4 mr-1" /> Simulate replanning</>}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 fade-up" data-testid="replan-result">
          <div className="flex items-center gap-3 text-sm text-zinc-400 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
            <Zap className="w-4 h-4 text-cyan-400" /> {result.note}
            <span className="ml-auto font-mono text-cyan-400">recomputed in {result.replanning_time_ms} ms</span>
          </div>
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <PlanSummary title="Before" plan={result.before} metrics={result.before_metrics} />
            <div className="flex items-center justify-center"><ArrowRight className="w-6 h-6 text-cyan-400" /></div>
            <PlanSummary title="Revised" plan={result.after} metrics={result.after_metrics} />
          </div>
          <Button onClick={() => run.mutate(true)} data-testid="apply-replan-btn"
            className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Check className="w-4 h-4 mr-1" /> Approve & apply revised plan
          </Button>
        </div>
      )}
    </div>
  );
}
