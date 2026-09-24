import { useOutletContext, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileUp, ListChecks, Layers, Users, Wand2, Kanban, RefreshCw, BarChart3,
  ArrowRight, Sparkles, CheckCircle2, Clock, Flame, TrendingUp
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
    <div className="bg-white border border-[#EADBCC] rounded-2xl p-5 shadow-xs">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-3xl font-display font-bold text-[#2A352C] mt-3">{value}</p>
      <p className="text-sm font-medium text-[#2A352C]">{label}</p>
      {subtext && <p className="text-xs text-[#5D675C] mt-0.5">{subtext}</p>}
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
  const epics = backlog.filter((b) => b.type === "epic");
  const doneItems = stories.filter((s) => s.board_status === "done");

  const activeSprint = sprint || sprints.find((s) => s.status === "active") || {
    name: "Sprint 4",
    goal: "Notifications, message status, testing and performance improvements",
    planned_points: 30,
    completed_points: 18,
    status: "active",
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
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF0E9] text-[#2B3B2E] border border-[#C8D6C7]">
            Software / Mobile & Web Application
          </span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF0E9] text-[#9C4827] border border-[#F1D6C7]">
            Methodology: Agile Scrum
          </span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F2E9] text-[#615545] border border-[#EADBCC]">
            Sprint Duration: 2 weeks
          </span>
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EDF3EB] text-[#344633] border border-[#C8D6C7] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#56654E] animate-pulse" />
            Current: Sprint 4 · Active
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold text-[#2A352C]">{project?.name || "Chatting Application – Like WhatsApp"}</h1>
        <p className="text-[#5D675C] mt-1.5 max-w-3xl leading-relaxed text-sm">
          {project?.description || "A real-time chatting application inspired by modern messaging platforms such as WhatsApp. Supports user registration, one-to-one messaging, group chats, media sharing, notifications, online/offline status, message delivery/read status, and basic profile management."}
        </p>
      </div>

      {/* Top High-level Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Layers} label="Product Backlog" value={backlog.length} subtext={`${stories.length} user stories · ${epics.length} epics`} accent="bg-[#FAF0E9] text-[#9C4827] border border-[#F1D6C7]" />
        <Stat icon={CheckCircle2} label="Completed Stories" value={doneItems.length} subtext={`${Math.round((doneItems.length / (stories.length || 1)) * 100)}% overall completion`} accent="bg-[#EDF3EB] text-[#344633] border border-[#C8D6C7]" />
        <Stat icon={Users} label="Scrum Team" value={devs.length} subtext="5 active cross-functional roles" accent="bg-[#F7F2E9] text-[#615545] border border-[#EADBCC]" />
        <Stat icon={Flame} label="Avg Sprint Velocity" value="23 pts" subtext="Delivered across Sprints 1–3" accent="bg-[#FAF0E9] text-[#9C4827] border border-[#F1D6C7]" />
      </div>

      {/* Active Sprint 4 Hero Banner */}
      <div className="bg-white border-2 border-[#C8D6C7] rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#EAF0E9] via-transparent to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#344633] bg-[#EAF0E9] border border-[#C8D6C7] px-2.5 py-0.5 rounded-lg">
                Active Sprint
              </span>
              <span className="text-xs font-mono text-[#5D675C] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#56654E]" /> Day 7 of 14 · Halfway through 2-week cycle
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#2A352C]">
              Sprint 4: Notifications, message status, testing and performance improvements
            </h2>
            <p className="text-xs text-[#5D675C] mt-1">
              Sprint Period: <span className="font-mono font-medium text-[#2A352C]">Sept 17, 2026 – Oct 01, 2026</span> · Team Capacity: <span className="font-mono font-medium text-[#2A352C]">88 pts available</span>
            </p>
          </div>

          <div className="flex gap-2.5 shrink-0">
            <Link to="board"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#56654E] hover:bg-[#46543F] text-[#FCF9F3] font-semibold text-xs rounded-xl shadow-xs transition">
              <Kanban className="w-4 h-4" /> View Sprint Board
            </Link>
            <Link to="planning"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF7F0] hover:bg-[#F3EDE2] text-[#2A352C] border border-[#EADBCC] font-semibold text-xs rounded-xl transition">
              <Wand2 className="w-4 h-4 text-[#56654E]" /> Plan Metrics
            </Link>
          </div>
        </div>

        {/* Progress Bars & Breakdown */}
        <div className="space-y-2 mt-4 pt-4 border-t border-[#EADBCC]/60">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-base text-[#2A352C]">{completedPts} <span className="text-xs font-normal text-[#5D675C]">/ {plannedPts} pts</span></span>
              <span className="font-semibold text-[#344633] bg-[#EAF0E9] px-2 py-0.5 rounded-md border border-[#C8D6C7]">{completionPct}% Completed</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-[#5D675C]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#56654E]" /> {completedPts} pts Done</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#CD7A56]" /> {inProgressPts} pts In Progress</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E7D0B5]" /> {todoPts} pts To Do</span>
            </div>
          </div>

          {/* Segmented Visual Progress */}
          <div className="h-3 w-full bg-[#FAF7F0] border border-[#EADBCC] rounded-full overflow-hidden flex">
            <div style={{ width: `${(completedPts / plannedPts) * 100}%` }} className="bg-[#56654E] h-full transition-all" title="Completed" />
            <div style={{ width: `${(inProgressPts / plannedPts) * 100}%` }} className="bg-[#CD7A56] h-full transition-all" title="In Progress" />
            <div style={{ width: `${(todoPts / plannedPts) * 100}%` }} className="bg-[#E7D0B5] h-full transition-all" title="To Do" />
          </div>
        </div>
      </div>

      {/* Sprints 1–4 Delivery History & Velocity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-[#2A352C] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#56654E]" /> Sprints Velocity & Delivery Progression
          </h2>
          <span className="text-xs font-mono text-[#5D675C]">Cadence: 2-week iterations</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sprint 1 */}
          <div className="bg-white border border-[#EADBCC] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#2A352C]">Sprint 1</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EAF0E9] text-[#344633] border border-[#C8D6C7] font-semibold">
                Completed
              </span>
            </div>
            <p className="text-xs text-[#5D675C] min-h-[32px] line-clamp-2">Goal: Project foundation and authentication</p>
            <div className="mt-4 pt-3 border-t border-[#EADBCC]/60">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#5D675C]">Delivered:</span>
                <span className="font-bold text-[#344633]">21 / 21 pts (100%)</span>
              </div>
              <Progress value={100} className="h-1.5 bg-[#FAF7F0] border border-[#EADBCC]" />
              <p className="text-[10px] text-[#879385] font-mono mt-2">Jul 23 – Aug 06, 2026</p>
            </div>
          </div>

          {/* Sprint 2 */}
          <div className="bg-white border border-[#EADBCC] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#2A352C]">Sprint 2</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EAF0E9] text-[#344633] border border-[#C8D6C7] font-semibold">
                Completed
              </span>
            </div>
            <p className="text-xs text-[#5D675C] min-h-[32px] line-clamp-2">Goal: Core messaging functionality</p>
            <div className="mt-4 pt-3 border-t border-[#EADBCC]/60">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#5D675C]">Delivered:</span>
                <span className="font-bold text-[#2A352C]">23 / 26 pts (88%)</span>
              </div>
              <Progress value={88} className="h-1.5 bg-[#FAF7F0] border border-[#EADBCC]" />
              <p className="text-[10px] text-[#879385] font-mono mt-2">Aug 07 – Aug 20, 2026</p>
            </div>
          </div>

          {/* Sprint 3 */}
          <div className="bg-white border border-[#EADBCC] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#2A352C]">Sprint 3</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#EAF0E9] text-[#344633] border border-[#C8D6C7] font-semibold">
                Completed
              </span>
            </div>
            <p className="text-xs text-[#5D675C] min-h-[32px] line-clamp-2">Goal: Group chat and media sharing</p>
            <div className="mt-4 pt-3 border-t border-[#EADBCC]/60">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#5D675C]">Delivered:</span>
                <span className="font-bold text-[#2A352C]">25 / 29 pts (86%)</span>
              </div>
              <Progress value={86} className="h-1.5 bg-[#FAF7F0] border border-[#EADBCC]" />
              <p className="text-[10px] text-[#879385] font-mono mt-2">Aug 21 – Sep 03, 2026</p>
            </div>
          </div>

          {/* Sprint 4 (Active) */}
          <div className="bg-white border-2 border-[#CD7A56] rounded-2xl p-5 shadow-xs relative">
            <div className="flex justify-between items-start mb-2">
              <span className="font-display font-bold text-base text-[#CD7A56]">Sprint 4</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF0E9] text-[#9C4827] border border-[#F1D6C7] font-bold">
                In Progress
              </span>
            </div>
            <p className="text-xs text-[#5D675C] min-h-[32px] line-clamp-2">Goal: Notifications, message status, testing & performance</p>
            <div className="mt-4 pt-3 border-t border-[#EADBCC]/60">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-[#5D675C]">Delivered:</span>
                <span className="font-bold text-[#CD7A56]">{completedPts} / {plannedPts} pts (60%)</span>
              </div>
              <Progress value={60} className="h-1.5 bg-[#FAF7F0] border border-[#EADBCC]" />
              <p className="text-[10px] text-[#CD7A56] font-mono font-semibold mt-2">Sep 17 – Oct 01, 2026 (Day 7)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Availability & Capacity Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A352C] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#56654E]" /> Scrum Team Availability & Sprint Capacity
            </h2>
            <p className="text-xs text-[#5D675C] mt-0.5">
              Weekly capacities with realistic availability percentages accounting for meetings, reviews, and support work.
            </p>
          </div>
          <Link to="team" className="text-xs text-[#CD7A56] font-semibold hover:underline flex items-center gap-1">
            Manage team <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {devs.map((d) => {
            const eff = Math.round(d.capacity_points * d.availability_pct / 100);
            return (
              <div key={d.id} className="bg-white border border-[#EADBCC] rounded-2xl p-4 shadow-xs hover:border-[#56654E] transition">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#EAF0E9] border border-[#C8D6C7] flex items-center justify-center text-[#56654E] font-bold text-xs shrink-0">
                    {d.avatar ? <img src={d.avatar} alt={d.name} className="w-full h-full object-cover" /> : initials(d.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#2A352C] truncate">{d.name}</p>
                    <p className="text-[10px] text-[#5D675C] truncate">{d.role}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-2 border-t border-[#EADBCC]/60">
                  <div className="flex justify-between">
                    <span className="text-[#5D675C]">Weekly Capacity:</span>
                    <span className="font-mono font-medium text-[#2A352C]">40 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5D675C]">Availability:</span>
                    <span className="font-mono font-bold text-[#CD7A56]">{d.availability_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5D675C]">Sprint Capacity:</span>
                    <span className="font-mono font-bold text-[#344633]">{eff} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Planning Pipeline Navigation */}
      <div>
        <h2 className="font-display text-xl font-bold text-[#2A352C] mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#56654E]" /> The Planning Pipeline
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <Link key={s.to} to={s.to} data-testid={`pipeline-${s.to}`}
              className="group bg-white border border-[#EADBCC] rounded-2xl p-5 hover:border-[#56654E] hover:shadow-xs transition-all flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#EADBCC] group-hover:bg-[#EAF0E9] group-hover:border-[#C8D6C7] flex items-center justify-center transition-colors">
                <s.icon className="w-5 h-5 text-[#5D675C] group-hover:text-[#56654E]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#879385]">STEP {i + 1}</p>
                <p className="font-semibold text-[#2A352C]">{s.label}</p>
                <p className="text-xs text-[#5D675C]">{s.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#879385] group-hover:text-[#56654E] group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      </div>

      {/* Breakdown Summary */}
      <div className="grid sm:grid-cols-3 gap-4 text-center">
        {[
          ["Epics", epics.length, "bg-[#EAF0E9] border-[#C8D6C7] text-[#344633]"],
          ["User Stories", stories.length, "bg-[#FAF0E9] border-[#F1D6C7] text-[#9C4827]"],
          ["Approved / Ready", backlog.filter((b) => b.status === "approved").length, "bg-[#F7F2E9] border-[#EADBCC] text-[#615545]"],
        ].map(([l, v, cl]) => (
          <div key={l} className="bg-white border border-[#EADBCC] rounded-2xl py-4 shadow-xs">
            <p className="text-2xl font-display font-bold text-[#2A352C]">{v}</p>
            <p className="text-xs uppercase tracking-wider font-mono text-[#5D675C] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
