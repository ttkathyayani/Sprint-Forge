import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend, CartesianGrid,
} from "recharts";
import { BarChart3, Target, Ruler, Trophy, Loader2, TrendingUp } from "lucide-react";
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
const METHOD_COLORS = { Random: "#9EB8D9", "Rule-based": "#CD7A56", "AI-Optimized": "#56654E" };

function Gauge({ label, value }) {
  const color = value >= 0.75 ? "#56654E" : value >= 0.5 ? "#CD7A56" : "#9B1C1C";
  return (
    <div className="bg-white border border-[#EADBCC] rounded-3xl p-6 text-center shadow-xs">
      <p className="text-xs font-mono uppercase text-[#636C61] mb-2 font-semibold">{label}</p>
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
  const { data: sprints = [] } = useQuery({ queryKey: ["sprints", pid], queryFn: () => api.get(`/projects/${pid}/sprints`).then((r) => r.data) });

  useEffect(() => { if (project) setGt(String(project.ground_truth_count || "")); }, [project]);

  const saveGt = useMutation({
    mutationFn: () => api.patch(`/projects/${pid}`, { ground_truth_count: Number(gt) || 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["evaluation", pid] }); qc.invalidateQueries({ queryKey: ["project", pid] }); },
  });

  if (isLoading || !data) return <Loader2 className="w-6 h-6 animate-spin text-[#56654E] mx-auto mt-10" />;

  const { srs, story_points, planners } = data;
  const methods = Object.keys(planners);
  const radarData = RADAR_KEYS.map(([k, label]) => {
    const row = { metric: label };
    methods.forEach((m) => (row[m] = planners[m][k]));
    return row;
  });
  const mpBar = methods.map((m) => ({ method: m, skill: planners[m].skill_match, balance: planners[m].workload_balance, priority: planners[m].priority_satisfaction }));

  const tooltipStyle = {
    background: "#FFFFFF",
    border: "1px solid #EADBCC",
    borderRadius: 12,
    color: "#2A352C",
    boxShadow: "0 4px 12px rgba(45,35,20,0.06)",
    padding: "8px 12px",
  };

  return (
    <div className="space-y-8 fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#2A352C] flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-[#56654E]" /> Analytics & Evaluation
        </h1>
        <p className="text-[#636C61] mt-1">Quantitative evidence for AI extraction quality and planning performance.</p>
      </div>

      {/* SRS extraction */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[#2A352C] flex items-center gap-2">
          <Target className="w-5 h-5 text-[#56654E]" /> SRS Extraction Quality
        </h2>
        <div className="flex flex-wrap items-end gap-3 bg-white border border-[#EADBCC] rounded-2xl p-4 shadow-xs">
          <div className="space-y-1">
            <Label className="text-xs text-[#636C61]">Ground-truth requirement count</Label>
            <Input value={gt} onChange={(e) => setGt(e.target.value)} type="number" data-testid="ground-truth-input"
              className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] w-40 h-9 rounded-xl" placeholder="e.g. 20" />
          </div>
          <Button onClick={() => saveGt.mutate()} data-testid="save-ground-truth" className="bg-[#56654E] hover:bg-[#46543F] text-[#FCF9F3] font-semibold h-9 rounded-xl shadow-xs">Recompute</Button>
          <p className="text-xs text-[#636C61] ml-auto">Extracted <span className="font-mono font-bold text-[#2A352C]">{srs.extracted}</span> · Unique <span className="font-mono font-bold text-[#2A352C]">{srs.unique}</span> · Duplicate rate <span className="font-mono font-bold text-[#2A352C]">{srs.duplicate_rate}%</span></p>
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
        <h2 className="font-display text-xl font-bold text-[#2A352C] flex items-center gap-2">
          <Ruler className="w-5 h-5 text-[#CD7A56]" /> Story Point Estimation
        </h2>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[#EADBCC] rounded-3xl p-6 flex flex-col justify-center items-center shadow-xs">
            <p className="text-xs font-mono uppercase text-[#636C61] font-semibold">Mean Absolute Error</p>
            <p className="text-5xl font-display font-bold text-[#CD7A56] mt-2">{story_points.mae}</p>
            <p className="text-xs text-[#7A8377] mt-1.5 font-mono">AI vs expert · {story_points.count} items</p>
          </div>
          <div className="lg:col-span-2 bg-white border border-[#EADBCC] rounded-3xl p-6 shadow-xs" data-testid="mae-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={story_points.pairs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2EDE4" />
                <XAxis dataKey="title" tick={false} stroke="#A0A8B4" />
                <YAxis stroke="#A0A8B4" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="ai" name="AI estimate" fill="#56654E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expert" name="Expert" fill="#CD7A56" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Planner comparison */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[#2A352C] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#CD7A56]" /> Sprint Planner Comparison
        </h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#EADBCC] rounded-3xl p-6 shadow-xs" data-testid="planner-radar">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#EADBCC" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#636C61", fontSize: 12 }} />
                {methods.map((m) => (
                  <Radar key={m} dataKey={m} stroke={METHOD_COLORS[m]} fill={METHOD_COLORS[m]} fillOpacity={0.25} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-[#EADBCC] rounded-3xl p-6 shadow-xs" data-testid="planner-bar">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mpBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2EDE4" />
                <XAxis dataKey="method" stroke="#A0A8B4" fontSize={12} />
                <YAxis stroke="#A0A8B4" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="skill" name="Skill match" fill="#56654E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="balance" name="Balance" fill="#CD7A56" radius={[4, 4, 0, 0]} />
                <Bar dataKey="priority" name="Priority sat." fill="#E7D0B5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {methods.length === 0 && <p className="text-sm text-[#636C61]">Add a team and approve backlog items to compare planners.</p>}
      </section>

      {/* Sprints Velocity & Delivery Progression */}
      {sprints.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#2A352C] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#56654E]" /> Sprint Velocity & Delivery Progression
          </h2>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="bg-white border border-[#EADBCC] rounded-3xl p-6 flex flex-col justify-center items-center shadow-xs text-center">
              <p className="text-xs font-mono uppercase text-[#636C61] font-semibold">Average Velocity</p>
              <p className="text-5xl font-display font-bold text-[#56654E] mt-2">23.0</p>
              <p className="text-xs text-[#7A8377] mt-1.5 font-mono">Story points delivered / sprint</p>
              <div className="mt-4 pt-4 border-t border-[#F2EDE4] w-full text-left space-y-1.5 text-xs text-[#636C61]">
                <div className="flex justify-between">
                  <span>Sprint 1:</span>
                  <span className="font-mono font-bold text-[#2A352C]">21 / 21 pts (100%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Sprint 2:</span>
                  <span className="font-mono font-bold text-[#2A352C]">23 / 26 pts (88%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Sprint 3:</span>
                  <span className="font-mono font-bold text-[#2A352C]">25 / 29 pts (86%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#CD7A56] font-semibold">Sprint 4 (Active):</span>
                  <span className="font-mono font-bold text-[#CD7A56]">18 / 30 pts (60%)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-[#EADBCC] rounded-3xl p-6 shadow-xs">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sprints.map((s) => ({
                  name: s.name,
                  planned: s.planned_points,
                  completed: s.completed_points,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2EDE4" />
                  <XAxis dataKey="name" stroke="#A0A8B4" fontSize={12} />
                  <YAxis stroke="#A0A8B4" fontSize={12} domain={[0, 35]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="planned" name="Planned Points" fill="#CD7A56" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Delivered Points" fill="#56654E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
