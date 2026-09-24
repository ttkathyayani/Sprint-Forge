import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, LogOut, Layers, Users, ArrowRight, Loader2, Trash2 } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SprintForgeLogo from "@/components/SprintForgeLogo";
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
    <div className="min-h-screen bg-[#FAF7F0]">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[#FAF7F0]/90 border-b border-[#EADBCC]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <SprintForgeLogo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#5D675C] hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-button"
              className="text-[#5D675C] hover:text-[#2A352C] hover:bg-[#F3EDE2] rounded-xl">
              <LogOut className="w-4 h-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-[#2A352C]">Projects</h1>
            <p className="text-[#5D675C] mt-1">Your AI-assisted sprint planning workspaces.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-project-button" className="bg-[#56654E] hover:bg-[#46543F] text-[#FCF9F3] font-semibold rounded-xl shadow-xs transition-all">
                <Plus className="w-4 h-4 mr-1.5" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#EADBCC] text-[#2A352C] rounded-2xl shadow-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-bold text-[#2A352C]">Create project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-[#5D675C]">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    data-testid="project-name-input" className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] rounded-xl"
                    placeholder="Payments Platform v2" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-[#5D675C]">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    data-testid="project-description-input" className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] rounded-xl resize-none"
                    placeholder="Short summary of the project" />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!name || create.isPending} onClick={() => create.mutate()}
                  data-testid="create-project-submit" className="bg-[#56654E] hover:bg-[#46543F] text-[#FCF9F3] font-semibold rounded-xl">
                  {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#56654E]" /></div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-[#EADBCC] bg-white/60 rounded-3xl py-20 text-center">
            <Layers className="w-10 h-10 text-[#879385] mx-auto mb-3" />
            <p className="text-[#5D675C]">No projects yet. Create your first workspace to begin.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div key={p.id} data-testid={`project-card-${p.id}`}
                className="group relative bg-white border border-[#EADBCC] rounded-3xl p-6 hover:border-[#56654E] hover:shadow-md transition-all cursor-pointer fade-up"
                onClick={() => nav(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#EAF0E9] border border-[#C8D6C7] flex items-center justify-center">
                    <Layers className="w-5 h-5 text-[#56654E]" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove.mutate(p.id); }}
                    data-testid={`delete-project-${p.id}`}
                    className="text-[#879385] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-[#FAEDE8]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-display text-xl font-bold text-[#2A352C] mt-4">{p.name}</h3>
                <p className="text-sm text-[#5D675C] mt-1 line-clamp-2 min-h-[2.5rem]">
                  {p.description || "No description"}
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF0E9] text-[#9C4827] border border-[#F1D6C7]">
                    <Layers className="w-3 h-3" /> {p.backlog_count} items
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF0E9] text-[#344633] border-[#C8D6C7] border">
                    <Users className="w-3 h-3" /> {p.team_count} devs
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#56654E] absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
