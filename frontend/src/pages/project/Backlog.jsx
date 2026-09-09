import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Layers, Check, X, Pencil, CheckCheck, Trash2, GitCommitHorizontal, Sparkles, Loader2,
} from "lucide-react";
import api, { apiError } from "@/lib/api";
import { PRIORITY, TYPE_STYLE } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

function statusBadge(s) {
  if (s === "approved") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (s === "rejected") return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  if (s === "blocked") return "bg-zinc-500/15 text-zinc-400 border-zinc-600/30";
  return "bg-amber-500/15 text-amber-400 border-amber-500/30";
}

export default function Backlog() {
  const { pid } = useParams();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["backlog", pid],
    queryFn: () => api.get(`/projects/${pid}/backlog`).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["backlog", pid] });

  const patch = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/backlog/${id}`, body),
    onSuccess: invalidate,
    onError: (e) => toast.error(apiError(e)),
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/backlog/${id}`),
    onSuccess: invalidate,
  });
  const approveAll = useMutation({
    mutationFn: () => api.post(`/projects/${pid}/backlog/approve-all`),
    onSuccess: (r) => { invalidate(); toast.success(`${r.data.approved} items approved`); },
  });

  const titleOf = (id) => items.find((i) => i.id === id)?.title || id;

  const Card = ({ item }) => {
    const pr = PRIORITY[item.priority] || PRIORITY.Medium;
    return (
      <div data-testid={`backlog-item-${item.id}`}
        className="relative bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${pr.stripe}`} />
        <div className="flex items-start justify-between gap-4 pl-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${TYPE_STYLE[item.type]}`}>{item.type}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${pr.badge}`}>{item.priority}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusBadge(item.status)}`}>{item.status}</span>
              {item.ai_confidence != null && (
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {Math.round(item.ai_confidence * 100)}%
                </span>
              )}
            </div>
            <h3 className="font-medium text-white">{item.title}</h3>
            {item.description && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{item.description}</p>}
            {item.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.skills.map((s) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">{s}</span>
                ))}
              </div>
            )}
            {item.acceptance_criteria?.length > 0 && (
              <ul className="mt-3 space-y-1">
                {item.acceptance_criteria.map((a, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-2"><Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> {a}</li>
                ))}
              </ul>
            )}
            {item.dependencies?.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                <GitCommitHorizontal className="w-3.5 h-3.5" /> depends on: {item.dependencies.map(titleOf).join(", ")}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-display font-bold text-indigo-300">
              {item.story_points}
            </div>
            <div className="flex gap-1">
              {item.status !== "approved" && (
                <button onClick={() => patch.mutate({ id: item.id, body: { status: "approved" } })}
                  data-testid={`approve-${item.id}`} title="Approve"
                  className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Check className="w-4 h-4" /></button>
              )}
              {item.status !== "rejected" && (
                <button onClick={() => patch.mutate({ id: item.id, body: { status: "rejected" } })}
                  data-testid={`reject-${item.id}`} title="Reject"
                  className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center"><X className="w-4 h-4" /></button>
              )}
              <button onClick={() => setEditing(item)} data-testid={`edit-${item.id}`} title="Edit"
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove.mutate(item.id)} data-testid={`delete-${item.id}`} title="Delete"
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-500 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const List = ({ type }) => {
    const filtered = items.filter((i) => i.type === type);
    if (filtered.length === 0)
      return <div className="text-center py-12 text-zinc-600 text-sm">No {type}s yet.</div>;
    return <div className="space-y-3">{filtered.map((i) => <Card key={i.id} item={i} />)}</div>;
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-400" /> Product Backlog
          </h1>
          <p className="text-zinc-500 mt-1">Review, edit and approve the AI-generated backlog (human-in-the-loop).</p>
        </div>
        <Button onClick={() => approveAll.mutate()} data-testid="approve-all-button"
          className="bg-emerald-600 hover:bg-emerald-500 text-white">
          {approveAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCheck className="w-4 h-4 mr-1" /> Approve all</>}
        </Button>
      </div>

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mt-10" /> : (
        <Tabs defaultValue="task">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="epic" data-testid="tab-epics">Epics ({items.filter((i) => i.type === "epic").length})</TabsTrigger>
            <TabsTrigger value="story" data-testid="tab-stories">Stories ({items.filter((i) => i.type === "story").length})</TabsTrigger>
            <TabsTrigger value="task" data-testid="tab-tasks">Tasks ({items.filter((i) => i.type === "task").length})</TabsTrigger>
          </TabsList>
          <TabsContent value="epic" className="mt-4"><List type="epic" /></TabsContent>
          <TabsContent value="story" className="mt-4"><List type="story" /></TabsContent>
          <TabsContent value="task" className="mt-4"><List type="task" /></TabsContent>
        </Tabs>
      )}

      <EditDialog editing={editing} setEditing={setEditing} patch={patch} />
    </div>
  );
}

function EditDialog({ editing, setEditing, patch }) {
  const [form, setForm] = useState({});
  const open = !!editing;
  const val = (k) => (form[k] !== undefined ? form[k] : editing?.[k]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setEditing(null); setForm({}); } }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader><DialogTitle className="font-display">Edit backlog item</DialogTitle></DialogHeader>
        {editing && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={val("title")} onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="edit-title-input" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={val("priority")} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger data-testid="edit-priority-select" className="bg-zinc-950 border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {["Critical", "High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>AI points</Label>
                <Input type="number" value={val("story_points")} onChange={(e) => setForm({ ...form, story_points: Number(e.target.value) })}
                  data-testid="edit-points-input" className="bg-zinc-950 border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label>Expert points</Label>
                <Input type="number" value={val("expert_points")} onChange={(e) => setForm({ ...form, expert_points: Number(e.target.value) })}
                  data-testid="edit-expert-input" className="bg-zinc-950 border-zinc-800" />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button data-testid="save-edit-button" className="bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={() => patch.mutate({ id: editing.id, body: form }, { onSuccess: () => { setEditing(null); setForm({}); } })}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
