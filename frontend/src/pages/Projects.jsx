import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, GitBranch, LogOut, Layers, Users, ArrowRight, Loader2, Trash2 } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export default function Projects() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get("/projects").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => api.post("/projects", { name, description }).then((r) => r.data),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setName("");
      setDescription("");
      nav(`/projects/${p.id}`);
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[#FAF8F4]/90 border-b border-[#E8E2D7]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#252830] font-display font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-[#F2EBFA] border border-[#D8C7F5] flex items-center justify-center text-[#552F8E]">
              <GitBranch className="w-4 h-4" />
            </div>
            SprintForge
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6D7584] hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-button"
              className="text-[#6D7584] hover:text-[#252830] hover:bg-[#F2EDE4] rounded-xl">
              <LogOut className="w-4 h-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-[#252830]">Projects</h1>
            <p className="text-[#6D7584] mt-1">Your AI-assisted sprint planning workspaces.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-project-button" className="bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl shadow-xs transition-all">
                <Plus className="w-4 h-4 mr-1.5" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#E8E2D7] text-[#252830] rounded-2xl shadow-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold text-[#252830]">Create project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    data-testid="project-name-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl"
                    placeholder="Payments Platform v2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    data-testid="project-description-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl resize-none"
                    placeholder="Short summary of the project" />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!name || create.isPending} onClick={() => create.mutate()}
                  data-testid="create-project-submit" className="bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl">
                  {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#552F8E]" /></div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-[#E8E2D7] bg-white/60 rounded-3xl py-20 text-center">
            <Layers className="w-10 h-10 text-[#A0A8B4] mx-auto mb-3" />
            <p className="text-[#6D7584]">No projects yet. Create your first workspace to begin.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div key={p.id} data-testid={`project-card-${p.id}`}
                className="group relative bg-white border border-[#E8E2D7] rounded-3xl p-6 hover:border-[#D8C7F5] hover:shadow-md transition-all cursor-pointer fade-up"
                onClick={() => nav(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#F2EBFA] border border-[#D8C7F5] flex items-center justify-center">
                    <Layers className="w-5 h-5 text-[#552F8E]" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove.mutate(p.id); }}
                    data-testid={`delete-project-${p.id}`}
                    className="text-[#A0A8B4] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-[#FDE8E8]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-display text-xl font-bold text-[#252830] mt-4">{p.name}</h3>
                <p className="text-sm text-[#6D7584] mt-1 line-clamp-2 min-h-[2.5rem]">
                  {p.description || "No description"}
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E6EEF6] text-[#2B486E] border border-[#B5CCE2]">
                    <Layers className="w-3 h-3" /> {p.backlog_count} items
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF4E8] text-[#2E5524] border-[#C5E1A5] border">
                    <Users className="w-3 h-3" /> {p.team_count} devs
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#552F8E] absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
