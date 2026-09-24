import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  GitBranch, LayoutDashboard, FileUp, ListChecks, Layers, Users,
  Wand2, Kanban, RefreshCw, BarChart3, ChevronLeft, LogOut,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import SprintForgeLogo from "@/components/SprintForgeLogo";

const NAV = [
  { to: "", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "srs", label: "SRS Upload", icon: FileUp },
  { to: "requirements", label: "Requirements", icon: ListChecks },
  { to: "backlog", label: "Product Backlog", icon: Layers },
  { to: "team", label: "Team & Skills", icon: Users },
  { to: "planning", label: "Sprint Planning", icon: Wand2 },
  { to: "board", label: "Sprint Board", icon: Kanban },
  { to: "replanning", label: "Dynamic Replanning", icon: RefreshCw },
  { to: "analytics", label: "Analytics & Evaluation", icon: BarChart3 },
];

export default function ProjectLayout() {
  const { pid } = useParams();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { data: project } = useQuery({
    queryKey: ["project", pid],
    queryFn: () => api.get(`/projects/${pid}`).then((r) => r.data),
  });

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex">
      <aside className="w-60 shrink-0 border-r border-[#EADBCC] bg-[#FAF7F0]/95 backdrop-blur-md flex flex-col fixed inset-y-0">
        <div className="h-16 flex items-center px-4 border-b border-[#EADBCC]">
          <SprintForgeLogo size="sm" />
        </div>
        <button onClick={() => nav("/projects")} data-testid="back-to-projects"
          className="flex items-center gap-1.5 px-5 py-3 text-xs text-[#5D675C] hover:text-[#2A352C] transition-colors">
          <ChevronLeft className="w-4 h-4" /> All projects
        </button>
        <div className="px-5 pb-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#879385]">Project</p>
          <p className="font-display font-semibold text-[#2A352C] truncate">{project?.name || "…"}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`nav-${n.to || "overview"}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive ? "bg-[#EAF0E9] text-[#2B3B2E] border border-[#C8D6C7] font-semibold shadow-xs"
                           : "text-[#5D675C] hover:text-[#2A352C] hover:bg-[#F3EDE2] border border-transparent"
                }`}>
              <n.icon className="w-4 h-4 text-[#56654E]" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#EADBCC] p-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-[#5D675C] truncate">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="sidebar-logout"
              className="h-8 w-8 text-[#5D675C] hover:text-[#2A352C] hover:bg-[#F3EDE2]">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <Outlet context={{ project }} />
        </div>
      </main>
    </div>
  );
}
