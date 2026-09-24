import { useOutletContext, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileUp, ListChecks, Layers, Users, Wand2, Kanban, RefreshCw, BarChart3,
  ArrowRight, Sparkles, CheckCircle2, Clock, Calendar, ShieldCheck, Flame,
  TrendingUp, Award, Activity
} from "lucide-react";
import api from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { initials } from "@/lib/format";

const STEPS = [
  { icon: FileUp, label: "SRS Upload", to: "srs", desc: "Ingest requirements" },
  { icon: Sparkles, label: "AI Backlog", to: "backlog", desc: "Epics · stories · tasks" },
  { icon: Users, label: "Team & Skills", to: "team", desc: "Capacity & skills" },
  { icon: Wand2, label: "Sprint Planning", to: "planning", desc: "Optimized assignment" },
  { icon: Kanban, label: "Sprint Board", to: "board", desc: "Execution" },
  { icon: RefreshCw, label: "Replanning", to: "replanning", desc: "Adapt to change" },
];

function Stat({ icon: Icon, label, value, subtext, accent }) {
  return (
    <div className="bg-white border border-[#E8E2D7] rounded-2xl p-5 shadow-xs">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-3xl font-display font-bold text-[#252830] mt-3">{value}</p>
      <p className="text-sm font-medium text-[#252830]">{label}</p>
      {subtext && <p className="text-xs text-[#6D7584] mt-0.5">{subtext}</p>}
    </div>
  );
}

export default function Overview() {
  const { project } = useOutletContext();
  const { pid } = useParams();

  const { data: backlog = [] } = useQuery({
    queryKey: ["backlog", pid],
    queryFn: () => api.get(`/projects/${pid}/backlog`).then((r) => r.data),
  });

  const { data: devs = [] } = useQuery({
    queryKey: ["devs", pid],
    queryFn: () => api.get(`/projects/${pid}/developers`).then((r) => r.data),
  });

  const { data: sprint } = useQuery({
    queryKey: ["sprint", pid],
    queryFn: () => api.get(`/projects/${pid}/sprint`).then((r) => r.data),
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ["sprints", pid],
    queryFn: () => api.get(`/projects/${pid}/sprints`).then((r) => r.data),
  });

  const stories = backlog.filter((b) => b.type === "story");
  const tasks = backlog.filter((b) => b.type === "task");
  const epics = backlog.filter((b) => b.type === "epic");
  const doneItems = stories.filter((s) => s.board_status === "done");
  const inProgressItems = stories.filter((s) => s.board_status === "in-progress");
  const todoItems = stories.filter((s) => (s.board_status === "todo" || !s.board_status));

  // Active sprint 4 calculations
  const activeSprint = sprint || sprints.find((s) => s.status === "active") || {
    name: "Sprint 4",
    goal: "Notifications, message status, testing and performance improvements",
    planned_points: 30,
    completed_points: 18,
    status: "active",
    day_progress: "Day 7 of 14 (50% elapsed)"
  };

  const plannedPts = activeSprint.planned_points || 30;
  const completedPts = activeSprint.completed_points || 18;
  const inProgressPts = 7;
  const todoPts = 5;
  const completionPct = Math.round((completedPts / plannedPts) * 100);

  return (
    <div className="space-y-8 fade-up">
      {/* Project Header & Metadata Tags */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#E6F5F9] text-[#1C5465] border border-[#BCE3EB]">
            Software / Mobile & Web Application
          </span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F2EBFA] text-[#552F8E] border border-[#D8C7F5]">
            Methodology: Agile Scrum
          </span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF8F4] text-[#4B5260] border border-[#E8E2D7]">
            Sprint Duration: 2 weeks
          </span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF4E8] text-[#2E5524] border border-[#C5E1A5] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#46A758] animate-pulse" />
            Current: Sprint 4 · Active
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold text-[#252830]">{project?.name || "Chatting Application – Like WhatsApp"}</h1>
        <p className="text-[#6D7584] mt-1.5 max-w-3xl leading-relaxed text-sm">
          {project?.description || "A real-time chatting application inspired by modern messaging platforms such as WhatsApp. Supports user registration, one-to-one messaging, group chats, media sharing, notifications, online/offline status, message delivery/read status, and basic profile management."}
        </p>
      </div>

      {/* Top High-level Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Layers} label="Product Backlog" value={backlog.length} subtext={`${stories.length} user stories · ${epics.length} epics`} accent="bg-[#F2EBFA] text-[#552F8E] border border-[#D8C7F5]" />
        <Stat icon={CheckCircle2} label="Completed Stories" value={doneItems.length} subtext={`${Math.round((doneItems.length / (stories.length || 1)) * 100)}% overall completion`} accent="bg-[#EAF4E8] text-[#2E5524] border border-[#C5E1A5]" />
        <Stat icon={Users} label="Scrum Team" value={devs.length} subtext="5 active cross-functional roles" accent="bg-[#E6EEF6] text-[#2B486E] border border-[#B5CCE2]" />
        <Stat icon={Flame} label="Avg Sprint Velocity" value="23 pts" subtext="Across Sprints 1–3" accent="bg-[#FAF0E6] text-[#8C4A12] border border-[#F3D7BD]" />
      </div>

      {/* Active Sprint 4 Hero Banner */}
      <div className="bg-white border-2 border-[#D8C7F5] rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F2EBFA] via-transparent to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#552F8E] bg-[#F2EBFA] border border-[#D8C7F5] px-2.5 py-0.5 rounded-lg">
                Active Sprint
              </span>
              <span className="text-xs font-mono text-[#6D7584] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#552F8E]" /> Day 7 of 14 · Halfway through 2-week cycle
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#252830]">
              Sprint 4: Notifications, message status, testing and performance improvements
            </h2>
            <p className="text-xs text-[#6D7584] mt-1">
              Sprint Period: <span className="font-mono font-medium text-[#252830]">Sept 17, 2026 – Oct 01, 2026</span> · Team Capacity: <span className="font-mono font-medium text-[#252830]">88 pts available</span>
            </p>
          </div>

          <div className="flex gap-2.5 shrink-0">
            <Link to="board"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold text-xs rounded-xl shadow-xs transition">
              <Kanban className="w-4 h-4" /> View Sprint Board
            </Link>
            <Link to="planning"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F4] hover:bg-[#F2EDE4] text-[#252830] border border-[#E8E2D7] font-semibold text-xs rounded-xl transition">
              <Wand2 className="w-4 h-4 text-[#552F8E]" /> Plan Metrics
            </Link>
          </div>
        </div>

        {/* Progress Bars & Breakdown */}
        <div className="space-y-2 mt-4 pt-4 border-t border-[#F2EDE4]">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-base text-[#252830]">{completedPts} <span className="text-xs font-normal text-[#6D7584]">/ {plannedPts} pts</span></span>
              <span className="font-semibold text-[#2E5524] bg-[#EAF4E8] px-2 py-0.5 rounded-md border border-[#C5E1A5]">{completionPct}% Completed</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-[#6D7584]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#46A758]" /> {completedPts} pts Done</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1C5465]" /> {inProgressPts} pts In Progress</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8A92A0]" /> {todoPts} pts To Do</span>
            </div>
          </div>

          {/* Segmented Visual Progress */}
          <div className="h-3 w-full bg-[#FAF8F4] border border-[#E8E2D7] rounded-full overflow-hidden flex">
            <div style={{ width: `${(completedPts / plannedPts) * 100}%` }} className="bg-[#46A758] h-full transition-all" title="Completed" />
            <div style={{ width: `${(inProgressPts / plannedPts) * 100}%` }} className="bg-[#60A5FA] h-full transition-all" title="In Progress" />
            <div style={{ width: `${(todoPts / plannedPts) * 100}%` }} className="bg-[#E8E2D7] h-full transition-all" title="To Do" />
          </div>
        </div>
      </div>

      {/* Sprints 1–4 Delivery History & Velocity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-[#252830] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#552F8E]" /> Sprints Velocity & Delivery Progression
          </h2>
          <span className="text-xs font-mono text-[#6D7584]">Cadence: 2-week iterations</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sprint 1 */}
          <div className="bg-white border border-[#E8E2D7] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#252830]">Sprint 1</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EAF4E8] text-[#2E5524] border border-[#C5E1A5] font-semibold">
                Completed
              </span>
            </div>
            <p className="text-xs text-[#6D7584] min-h-[32px] line-clamp-2">Goal: Project foundation and authentication</p>
            <div className="mt-4 pt-3 border-t border-[#F2EDE4]">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#6D7584]">Delivered:</span>
                <span className="font-bold text-[#2E5524]">21 / 21 pts (100%)</span>
              </div>
              <Progress value={100} className="h-1.5 bg-[#FAF8F4] border border-[#E8E2D7]" />
              <p className="text-[10px] text-[#8A92A0] font-mono mt-2">Jul 23 – Aug 06, 2026</p>
            </div>
          </div>

          {/* Sprint 2 */}
          <div className="bg-white border border-[#E8E2D7] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#252830]">Sprint 2</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EAF4E8] text-[#2E5524] border border-[#C5E1A5] font-semibold">
                Completed
              </span>
            </div>
            <p className="text-xs text-[#6D7584] min-h-[32px] line-clamp-2">Goal: Core messaging functionality</p>
            <div className="mt-4 pt-3 border-t border-[#F2EDE4]">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#6D7584]">Delivered:</span>
                <span className="font-bold text-[#252830]">23 / 26 pts (88%)</span>
              </div>
              <Progress value={88} className="h-1.5 bg-[#FAF8F4] border border-[#E8E2D7]" />
              <p className="text-[10px] text-[#8A92A0] font-mono mt-2">Aug 07 – Aug 20, 2026</p>
            </div>
          </div>

          {/* Sprint 3 */}
          <div className="bg-white border border-[#E8E2D7] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#252830]">Sprint 3</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EAF4E8] text-[#2E5524] border border-[#C5E1A5] font-semibold">
                Completed
              </span>
            </div>
            <p className="text-xs text-[#6D7584] min-h-[32px] line-clamp-2">Goal: Group chat and media sharing</p>
            <div className="mt-4 pt-3 border-t border-[#F2EDE4]">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#6D7584]">Delivered:</span>
                <span className="font-bold text-[#252830]">25 / 29 pts (86%)</span>
              </div>
              <Progress value={86} className="h-1.5 bg-[#FAF8F4] border border-[#E8E2D7]" />
              <p className="text-[10px] text-[#8A92A0] font-mono mt-2">Aug 21 – Sep 03, 2026</p>
            </div>
          </div>

          {/* Sprint 4 (Active) */}
          <div className="bg-white border-2 border-[#D8C7F5] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#552F8E]">Sprint 4</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#E6F5F9] text-[#1C5465] border border-[#BCE3EB] font-bold">
                In Progress
              </span>
            </div>
            <p className="text-xs text-[#6D7584] min-h-[32px] line-clamp-2">Goal: Notifications, message status, testing & performance</p>
            <div className="mt-4 pt-3 border-t border-[#F2EDE4]">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#6D7584]">Delivered:</span>
                <span className="font-bold text-[#552F8E]">{completedPts} / {plannedPts} pts (60%)</span>
              </div>
              <Progress value={60} className="h-1.5 bg-[#FAF8F4] border border-[#E8E2D7]" />
              <p className="text-[10px] text-[#552F8E] font-mono font-semibold mt-2">Sep 17 – Oct 01, 2026 (Day 7)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Availability & Capacity Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#252830] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1C5465]" /> Scrum Team Availability & Sprint Capacity
            </h2>
            <p className="text-xs text-[#6D7584] mt-0.5">
              Weekly capacities with realistic availability percentages accounting for meetings, reviews, and support work.
            </p>
          </div>
          <Link to="team" className="text-xs text-[#552F8E] font-semibold hover:underline flex items-center gap-1">
            Manage team <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {devs.map((d) => {
            const eff = Math.round(d.capacity_points * d.availability_pct / 100);
            return (
              <div key={d.id} className="bg-white border border-[#E8E2D7] rounded-2xl p-4 shadow-xs hover:border-[#D8C7F5] transition">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#F2EBFA] border border-[#D8C7F5] flex items-center justify-center text-[#552F8E] font-bold text-xs shrink-0">
                    {d.avatar ? <img src={d.avatar} alt={d.name} className="w-full h-full object-cover" /> : initials(d.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#252830] truncate">{d.name}</p>
                    <p className="text-[10px] text-[#6D7584] truncate">{d.role}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-2 border-t border-[#F2EDE4]">
                  <div className="flex justify-between">
                    <span className="text-[#6D7584]">Weekly Capacity:</span>
                    <span className="font-mono font-medium text-[#252830]">40 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D7584]">Availability:</span>
                    <span className="font-mono font-bold text-[#552F8E]">{d.availability_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6D7584]">Sprint Capacity:</span>
                    <span className="font-mono font-bold text-[#2E5524]">{eff} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Planning Pipeline Navigation */}
      <div>
        <h2 className="font-display text-xl font-bold text-[#252830] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#552F8E]" /> The Planning Pipeline
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

      {/* Breakdown Summary */}
      <div className="grid sm:grid-cols-3 gap-4 text-center">
        {[
          ["Epics", epics.length, "bg-[#F2ECFA] border-[#DDD0F7] text-[#513279]"],
          ["User Stories", stories.length, "bg-[#F2EBFA] border-[#D8C7F5] text-[#552F8E]"],
          ["Approved / Ready", backlog.filter((b) => b.status === "approved").length, "bg-[#E6F5F9] border-[#BCE3EB] text-[#1C5465]"],
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
