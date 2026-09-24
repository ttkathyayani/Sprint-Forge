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
    <div className="bg-white border border-[#E8E2D7] rounded-2xl p-5 shadow-xs">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-3xl font-display font-bold text-[#252830] mt-3">{value}</p>
      <p className="text-sm text-[#6D7584]">{label}</p>
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
        <h1 className="font-display text-4xl font-bold text-[#252830]">{project?.name}</h1>
        <p className="text-[#6D7584] mt-1">{project?.description || "AI-assisted sprint planning workspace"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Layers} label="Backlog items" value={backlog.length} accent="bg-[#F2EBFA] text-[#552F8E] border border-[#D8C7F5]" />
        <Stat icon={ListChecks} label="Awaiting review" value={proposed} accent="bg-[#F2ECFA] text-[#513279] border border-[#DDD0F7]" />
        <Stat icon={Users} label="Team members" value={devs.length} accent="bg-[#E6EEF6] text-[#2B486E] border border-[#B5CCE2]" />
        <Stat icon={Wand2} label="Sprint status" value={sprint ? "Planned" : "—"} accent="bg-[#EAF4E8] text-[#2E5524] border border-[#C5E1A5]" />
      </div>

      <div>
        <h2 className="font-display text-xl font-bold text-[#252830] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#552F8E]" /> The planning pipeline
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <Link key={s.to} to={s.to} data-testid={`pipeline-${s.to}`}
              className="group bg-white border border-[#E8E2D7] rounded-2xl p-5 hover:border-[#D8C7F5] hover:shadow-xs transition-all flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F4] border border-[#E8E2D7] group-hover:bg-[#F2EBFA] group-hover:border-[#D8C7F5] flex items-center justify-center transition-colors">
                <s.icon className="w-5 h-5 text-[#6D7584] group-hover:text-[#552F8E]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#8A92A0]">STEP {i + 1}</p>
                <p className="font-semibold text-[#252830]">{s.label}</p>
                <p className="text-xs text-[#6D7584]">{s.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#A0A8B4] group-hover:text-[#552F8E] group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-center">
        {[
          ["Epics", backlog.filter((b) => b.type === "epic").length, "bg-[#F2ECFA] border-[#DDD0F7] text-[#513279]"],
          ["Stories", stories, "bg-[#F2EBFA] border-[#D8C7F5] text-[#552F8E]"],
          ["Tasks", tasks, "bg-[#E6F5F9] border-[#BCE3EB] text-[#1C5465]"],
        ].map(([l, v, cl]) => (
          <div key={l} className="bg-white border border-[#E8E2D7] rounded-2xl py-4 shadow-xs">
            <p className="text-2xl font-display font-bold text-[#252830]">{v}</p>
            <p className="text-xs uppercase tracking-wider font-mono text-[#6D7584] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
