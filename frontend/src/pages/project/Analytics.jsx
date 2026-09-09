import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend, CartesianGrid,
} from "recharts";
import { BarChart3, Target, Ruler, Trophy, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const RADAR_KEYS = [
  ["capacity_utilization", "Capacity"],
  ["workload_balance", "Balance"],
  ["skill_match", "Skill"],
  ["priority_satisfaction", "Priority"],
  ["dependency_satisfaction", "Dependency"],
];
const METHOD_COLORS = { Random: "#71717A", "Rule-based": "#F59E0B", "AI-Optimized": "#6366F1" };

function Gauge({ label, value }) {
  const color = value >= 0.75 ? "#10B981" : value >= 0.5 ? "#F59E0B" : "#F43F5E";
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center">
      <p className="text-xs font-mono uppercase text-zinc-500 mb-2">{label}</p>
      <p className="text-4xl font-display font-bold" style={{ color }}>{(value * 100).toFixed(1)}%</p>
    </div>
  );
}

export default function Analytics() {
  const { pid } = useParams();
  const qc = useQueryClient();
  const [gt, setGt] = useState("");

  const { data: project } = useQuery({ queryKey: ["project", pid], queryFn: () => api.get(`/projects/${pid}`).then((r) => r.data) });
  const { data, isLoading } = useQuery({ queryKey: ["evaluation", pid], queryFn: () => api.get(`/projects/${pid}/evaluation`).then((r) => r.data) });

  useEffect(() => { if (project) setGt(String(project.ground_truth_count || "")); }, [project]);

  const saveGt = useMutation({
    mutationFn: () => api.patch(`/projects/${pid}`, { ground_truth_count: Number(gt) || 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evaluation", pid] }); qc.invalidateQueries({ queryKey: ["project", pid] }); },
  });

  if (isLoading || !data) return <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mt-10" />;

  const { srs, story_points, planners } = data;
  const methods = Object.keys(planners);
  const radarData = RADAR_KEYS.map(([k, label]) => {
    const row = { metric: label };
    methods.forEach((m) => (row[m] = planners[m][k]));
    return row;
  });
  const mpBar = methods.map((m) => ({ method: m, skill: planners[m].skill_match, balance: planners[m].workload_balance, priority: planners[m].priority_satisfaction }));

  return (
    <div className="space-y-8 fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-indigo-400" /> Analytics & Evaluation
        </h1>
        <p className="text-zinc-500 mt-1">Quantitative evidence for AI extraction quality and planning performance.</p>
      </div>

      {/* SRS extraction */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2"><Target className="w-5 h-5 text-cyan-400" /> SRS Extraction Quality</h2>
        <div className="flex flex-wrap items-end gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-500">Ground-truth requirement count</Label>
            <Input value={gt} onChange={(e) => setGt(e.target.value)} type="number" data-testid="ground-truth-input"
              className="bg-zinc-950 border-zinc-800 w-40 h-9" placeholder="e.g. 20" />
          </div>
          <Button onClick={() => saveGt.mutate()} data-testid="save-ground-truth" className="bg-indigo-600 hover:bg-indigo-500 text-white h-9">Recompute</Button>
          <p className="text-xs text-zinc-500 ml-auto">Extracted {srs.extracted} · Unique {srs.unique} · Duplicate rate {srs.duplicate_rate}%</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Gauge label="Precision" value={srs.precision} />
          <Gauge label="Recall" value={srs.recall} />
          <Gauge label="F1 Score" value={srs.f1} />
          <Gauge label="Coverage" value={srs.coverage / 100} />
        </div>
      </section>

      {/* Story point MAE */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2"><Ruler className="w-5 h-5 text-amber-400" /> Story Point Estimation</h2>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center items-center">
            <p className="text-xs font-mono uppercase text-zinc-500">Mean Absolute Error</p>
            <p className="text-5xl font-display font-bold text-amber-400 mt-2">{story_points.mae}</p>
            <p className="text-xs text-zinc-600 mt-1">AI vs expert · {story_points.count} items</p>
          </div>
          <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5" data-testid="mae-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={story_points.pairs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="title" tick={false} stroke="#52525b" />
                <YAxis stroke="#52525b" fontSize={12} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }} />
                <Legend />
                <Bar dataKey="ai" name="AI estimate" fill="#6366F1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expert" name="Expert" fill="#06B6D4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Planner comparison */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-indigo-400" /> Sprint Planner Comparison</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5" data-testid="planner-radar">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                {methods.map((m) => (
                  <Radar key={m} dataKey={m} stroke={METHOD_COLORS[m]} fill={METHOD_COLORS[m]} fillOpacity={0.25} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5" data-testid="planner-bar">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mpBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="method" stroke="#52525b" fontSize={12} />
                <YAxis stroke="#52525b" fontSize={12} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }} />
                <Legend />
                <Bar dataKey="skill" name="Skill match" fill="#6366F1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="balance" name="Balance" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="priority" name="Priority sat." fill="#A855F7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {methods.length === 0 && <p className="text-sm text-zinc-500">Add a team and approve backlog items to compare planners.</p>}
      </section>
    </div>
  );
}
