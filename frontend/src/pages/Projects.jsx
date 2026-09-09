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
    <div className="min-h-screen bg-[#09090b]">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-display font-bold text-lg">
            <GitBranch className="w-5 h-5 text-indigo-400" /> SprintForge
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-button"
              className="text-zinc-400 hover:text-white">
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">Projects</h1>
            <p className="text-zinc-500 mt-1">Your AI-assisted sprint planning workspaces.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-project-button" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="w-4 h-4 mr-1" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle className="font-display">Create project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    data-testid="project-name-input" className="bg-zinc-950 border-zinc-800"
                    placeholder="Payments Platform v2" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    data-testid="project-description-input" className="bg-zinc-950 border-zinc-800"
                    placeholder="Short summary of the project" />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!name || create.isPending} onClick={() => create.mutate()}
                  data-testid="create-project-submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl py-20 text-center">
            <Layers className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">No projects yet. Create your first workspace to begin.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div key={p.id} data-testid={`project-card-${p.id}`}
                className="group relative bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors cursor-pointer fade-up"
                onClick={() => nav(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-indigo-400" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove.mutate(p.id); }}
                    data-testid={`delete-project-${p.id}`}
                    className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-display text-xl font-semibold text-white mt-4">{p.name}</h3>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2 min-h-[2.5rem]">
                  {p.description || "No description"}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {p.backlog_count} items</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.team_count} devs</span>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
