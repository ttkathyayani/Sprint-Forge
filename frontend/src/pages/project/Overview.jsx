import { useOutletContext, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileUp, ListChecks, Layers, Users, Wand2, Kanban, RefreshCw, BarChart3,
  ArrowRight, Sparkles,
} from "lucide-react";
import api from "@/lib/api";

const STEPS = [
  { icon: FileUp, label: "SRS Upload", to: "srs", desc: "Ingest requirements" },
  { icon: Sparkles, label: "AI Backlog", to: "backlog", desc: "Epics · stories · tasks" },
  { icon: Users, label: "Team & Skills", to: "team", desc: "Capacity & skills" },
  { icon: Wand2, label: "Sprint Planning", to: "planning", desc: "Optimized assignment" },
  { icon: Kanban, label: "Sprint Board", to: "board", desc: "Execution" },
  { icon: RefreshCw, label: "Replanning", to: "replanning", desc: "Adapt to change" },
];

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-3xl font-display font-bold text-white mt-3">{value}</p>
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}

export default function Overview() {
  const { project } = useOutletContext();
  const { pid } = useParams();
  const { data: backlog = [] } = useQuery({ queryKey: ["backlog", pid], queryFn: () => api.get(`/projects/${pid}/backlog`).then((r) => r.data) });
  const { data: devs = [] } = useQuery({ queryKey: ["devs", pid], queryFn: () => api.get(`/projects/${pid}/developers`).then((r) => r.data) });
  const { data: sprint } = useQuery({ queryKey: ["sprint", pid], queryFn: () => api.get(`/projects/${pid}/sprint`).then((r) => r.data) });

  const stories = backlog.filter((b) => b.type === "story").length;
  const tasks = backlog.filter((b) => b.type === "task").length;
  const proposed = backlog.filter((b) => b.status === "proposed").length;

  return (
    <div className="space-y-8 fade-up">
      <div>
        <h1 className="font-display text-4xl font-bold text-white">{project?.name}</h1>
        <p className="text-zinc-500 mt-1">{project?.description || "AI-assisted sprint planning workspace"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Layers} label="Backlog items" value={backlog.length} accent="bg-indigo-500/15 text-indigo-400" />
        <Stat icon={ListChecks} label="Awaiting review" value={proposed} accent="bg-amber-500/15 text-amber-400" />
        <Stat icon={Users} label="Team members" value={devs.length} accent="bg-cyan-500/15 text-cyan-400" />
        <Stat icon={Wand2} label="Sprint status" value={sprint ? "Planned" : "—"} accent="bg-emerald-500/15 text-emerald-400" />
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" /> The planning pipeline
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <Link key={s.to} to={s.to} data-testid={`pipeline-${s.to}`}
              className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-indigo-500/15 flex items-center justify-center transition-colors">
                <s.icon className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-mono text-zinc-600">STEP {i + 1}</p>
                <p className="font-medium text-white">{s.label}</p>
                <p className="text-xs text-zinc-500">{s.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-center">
        {[["Epics", backlog.filter((b) => b.type === "epic").length], ["Stories", stories], ["Tasks", tasks]].map(([l, v]) => (
          <div key={l} className="bg-zinc-900/40 border border-zinc-800 rounded-xl py-4">
            <p className="text-2xl font-display font-bold text-white">{v}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
