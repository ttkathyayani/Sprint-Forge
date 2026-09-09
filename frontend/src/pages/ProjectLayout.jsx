import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  GitBranch, LayoutDashboard, FileUp, ListChecks, Layers, Users,
  Wand2, Kanban, RefreshCw, BarChart3, ChevronLeft, LogOut,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-[#09090b] flex">
      <aside className="w-60 shrink-0 border-r border-zinc-800 flex flex-col fixed inset-y-0">
        <div className="h-16 flex items-center px-5 border-b border-zinc-800 gap-2 text-white font-display font-bold">
          <GitBranch className="w-5 h-5 text-indigo-400" /> SprintForge
        </div>
        <button onClick={() => nav("/projects")} data-testid="back-to-projects"
          className="flex items-center gap-1 px-5 py-3 text-xs text-zinc-500 hover:text-zinc-300">
          <ChevronLeft className="w-4 h-4" /> All projects
        </button>
        <div className="px-5 pb-3">
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-600">Project</p>
          <p className="font-display font-semibold text-white truncate">{project?.name || "…"}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`nav-${n.to || "overview"}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                           : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                }`}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-zinc-500 truncate">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="sidebar-logout"
              className="h-8 w-8 text-zinc-500 hover:text-white">
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
