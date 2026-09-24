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
          <h1 className="font-display text-3xl font-bold text-[#252830] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#1C5465]" /> Team & Skills
          </h1>
          <p className="text-[#6D7584] mt-1">Model developer skills, availability and sprint capacity.</p>
        </div>
        <div className="flex gap-2.5">
          {devs.length === 0 && (
            <Button variant="outline" onClick={() => seed.mutate()} data-testid="seed-team-button"
              className="border-[#E8E2D7] bg-white text-[#252830] hover:bg-[#F2EDE4] rounded-xl shadow-xs">
              {seed.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1.5" /> Add sample team</>}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-developer-button" className="bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl shadow-xs transition-all">
                <Plus className="w-4 h-4 mr-1.5" /> Add developer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#E8E2D7] text-[#252830] rounded-2xl shadow-lg">
              <DialogHeader><DialogTitle className="font-display text-xl font-bold text-[#252830]">Add developer</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="dev-name-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Role</Label>
                    <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} data-testid="dev-role-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Skills (comma separated)</Label>
                  <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="Python, FastAPI, React" data-testid="dev-skills-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Availability: {form.availability_pct}%</Label>
                  <Slider value={[form.availability_pct]} min={0} max={100} step={10}
                    onValueChange={(v) => setForm({ ...form, availability_pct: v[0] })} data-testid="dev-availability-slider" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Capacity (points)</Label>
                    <Input type="number" value={form.capacity_points} onChange={(e) => setForm({ ...form, capacity_points: e.target.value })} data-testid="dev-capacity-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Experience (yrs)</Label>
                    <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} data-testid="dev-experience-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!form.name || add.isPending} onClick={submit} data-testid="save-developer-button"
                  className="bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl">
                  {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#552F8E] mx-auto mt-10" /> : devs.length === 0 ? (
        <div className="border border-dashed border-[#E8E2D7] bg-white/60 rounded-3xl py-16 text-center text-[#6D7584]">
          No developers yet. Add your team to enable capacity-aware planning.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {devs.map((d) => {
            const eff = Math.round(d.capacity_points * d.availability_pct / 100);
            return (
              <div key={d.id} data-testid={`developer-card-${d.id}`}
                className="bg-white border border-[#E8E2D7] rounded-3xl p-6 shadow-xs group hover:border-[#D8C7F5] transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#F2EBFA] border border-[#D8C7F5] flex items-center justify-center text-[#552F8E] font-display font-bold shrink-0">
                    {d.avatar ? <img src={d.avatar} alt={d.name} className="w-full h-full object-cover" /> : initials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#252830] truncate text-base">{d.name}</p>
                    <p className="text-xs text-[#6D7584] mt-0.5">{d.role} · {d.experience_years}y exp</p>
                  </div>
                  <button onClick={() => remove.mutate(d.id)} data-testid={`delete-dev-${d.id}`}
                    className="text-[#A0A8B4] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-[#FDE8E8]"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {d.skills.map((s) => (
                    <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#FAF8F4] text-[#4B5260] border border-[#E8E2D7] font-medium">{s}</span>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#6D7584]">Availability</span>
                      <span className={`font-mono font-medium ${utilColor(100 - d.availability_pct)}`}>{d.availability_pct}%</span>
                    </div>
                    <Progress value={d.availability_pct} className="h-1.5 bg-[#FAF8F4] border border-[#E8E2D7]" />
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-[#F2EDE4]">
                    <span className="text-[#6D7584]">Sprint capacity</span>
                    <span className="font-mono font-bold text-[#252830]">{eff} <span className="text-[#8A92A0] font-normal">/ {d.capacity_points} pts</span></span>
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
