import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { utilColor, initials } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

const SAMPLE_TEAM = [
  { name: "Thirumal", role: "Lead Fullstack", skills: ["Python", "FastAPI", "JWT", "PostgreSQL", "React"], experience_years: 8, availability_pct: 100, capacity_points: 22,
    avatar: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?crop=entropy&cs=srgb&fm=jpg&w=200&q=80" },
  { name: "Kathyayani", role: "Backend / AI", skills: ["Python", "FastAPI", "PostgreSQL", "MongoDB"], experience_years: 6, availability_pct: 80, capacity_points: 20,
    avatar: "https://images.unsplash.com/photo-1536104968055-4d61aa56f46a?crop=entropy&cs=srgb&fm=jpg&w=200&q=80" },
  { name: "Durga", role: "DevOps / Cloud", skills: ["Docker", "Kubernetes", "AWS", "CI/CD"], experience_years: 7, availability_pct: 100, capacity_points: 18,
    avatar: "https://images.unsplash.com/photo-1631624210938-539575f92e3c?crop=entropy&cs=srgb&fm=jpg&w=200&q=80" },
  { name: "David Miller", role: "Frontend", skills: ["React", "JavaScript", "CSS", "TypeScript"], experience_years: 5, availability_pct: 90, capacity_points: 20,
    avatar: "https://images.unsplash.com/photo-1604145559206-e3bce0040e2d?crop=entropy&cs=srgb&fm=jpg&w=200&q=80" },
];

const EMPTY = { name: "", role: "Engineer", skills: "", experience_years: 3, availability_pct: 100, capacity_points: 20 };

export default function Team() {
  const { pid } = useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: devs = [], isLoading } = useQuery({
    queryKey: ["devs", pid],
    queryFn: () => api.get(`/projects/${pid}/developers`).then((r) => r.data),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["devs", pid] });

  const add = useMutation({
    mutationFn: (body) => api.post(`/projects/${pid}/developers`, body),
    onSuccess: () => { invalidate(); setOpen(false); setForm(EMPTY); },
    onError: (e) => toast.error(apiError(e)),
  });
  const remove = useMutation({ mutationFn: (id) => api.delete(`/developers/${id}`), onSuccess: invalidate });
  const seed = useMutation({
    mutationFn: async () => { for (const d of SAMPLE_TEAM) await api.post(`/projects/${pid}/developers`, d); },
    onSuccess: () => { invalidate(); toast.success("Sample team added"); },
  });

  const submit = () => add.mutate({
    ...form,
    skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    experience_years: Number(form.experience_years),
    availability_pct: Number(form.availability_pct),
    capacity_points: Number(form.capacity_points),
  });

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-cyan-400" /> Team & Skills
          </h1>
          <p className="text-zinc-500 mt-1">Model developer skills, availability and sprint capacity.</p>
        </div>
        <div className="flex gap-2">
          {devs.length === 0 && (
            <Button variant="outline" onClick={() => seed.mutate()} data-testid="seed-team-button"
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
              {seed.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1" /> Add sample team</>}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-developer-button" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add developer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader><DialogTitle className="font-display">Add developer</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="dev-name-input" className="bg-zinc-950 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Role</Label>
                    <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} data-testid="dev-role-input" className="bg-zinc-950 border-zinc-800" /></div>
                </div>
                <div className="space-y-2"><Label>Skills (comma separated)</Label>
                  <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="Python, FastAPI, React" data-testid="dev-skills-input" className="bg-zinc-950 border-zinc-800" /></div>
                <div className="space-y-2">
                  <Label>Availability: {form.availability_pct}%</Label>
                  <Slider value={[form.availability_pct]} min={0} max={100} step={10}
                    onValueChange={(v) => setForm({ ...form, availability_pct: v[0] })} data-testid="dev-availability-slider" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Capacity (points)</Label>
                    <Input type="number" value={form.capacity_points} onChange={(e) => setForm({ ...form, capacity_points: e.target.value })} data-testid="dev-capacity-input" className="bg-zinc-950 border-zinc-800" /></div>
                  <div className="space-y-2"><Label>Experience (yrs)</Label>
                    <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} data-testid="dev-experience-input" className="bg-zinc-950 border-zinc-800" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!form.name || add.isPending} onClick={submit} data-testid="save-developer-button"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mt-10" /> : devs.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl py-16 text-center text-zinc-500">
          No developers yet. Add your team to enable capacity-aware planning.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devs.map((d) => {
            const eff = Math.round(d.capacity_points * d.availability_pct / 100);
            return (
              <div key={d.id} data-testid={`developer-card-${d.id}`}
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 group">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-500/20 border border-zinc-700 flex items-center justify-center text-indigo-300 font-display font-bold shrink-0">
                    {d.avatar ? <img src={d.avatar} alt={d.name} className="w-full h-full object-cover" /> : initials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{d.name}</p>
                    <p className="text-xs text-zinc-500">{d.role} · {d.experience_years}y</p>
                  </div>
                  <button onClick={() => remove.mutate(d.id)} data-testid={`delete-dev-${d.id}`}
                    className="text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {d.skills.map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">{s}</span>)}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-zinc-500">Availability</span><span className={utilColor(100 - d.availability_pct)}>{d.availability_pct}%</span></div>
                    <Progress value={d.availability_pct} className="h-1.5 bg-zinc-800" />
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-zinc-800">
                    <span className="text-zinc-500">Sprint capacity</span>
                    <span className="font-mono text-white">{eff} <span className="text-zinc-600">/ {d.capacity_points} pts</span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
