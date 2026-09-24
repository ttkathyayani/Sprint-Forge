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
  if (s === "approved") return "bg-[#EAF4E8] text-[#2E5524] border-[#C5E1A5]";
  if (s === "rejected") return "bg-[#FDE8E8] text-[#9B1C1C] border-[#F8B4B4]";
  if (s === "blocked") return "bg-[#F1F3F5] text-[#495057] border-[#CED4DA]";
  return "bg-[#F2ECFA] text-[#513279] border-[#DDD0F7]";
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
        className="relative bg-white border border-[#E8E2D7] rounded-2xl p-5 overflow-hidden shadow-xs hover:border-[#D8C7F5] transition-all">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${pr.stripe}`} />
        <div className="flex items-start justify-between gap-4 pl-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {item.key && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#FAF8F4] text-[#552F8E] border border-[#D8C7F5]">
                  {item.key}
                </span>
              )}
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg border font-medium ${TYPE_STYLE[item.type]}`}>{item.type}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-medium ${pr.badge}`}>{item.priority}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-medium ${statusBadge(item.status)}`}>{item.status}</span>
              {item.board_status && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-semibold ${
                  item.board_status === "done" ? "bg-[#EAF4E8] text-[#2E5524] border-[#C5E1A5]" :
                  item.board_status === "in-progress" ? "bg-[#E6F5F9] text-[#1C5465] border-[#BCE3EB]" :
                  "bg-[#F3F6FA] text-[#2B486E] border-[#D0DFEE]"
                }`}>
                  {item.board_status === "in-progress" ? "In Progress" : item.board_status === "done" ? "Done" : "To Do"}
                </span>
              )}
              {item.assignee_name && (
                <span className="text-[10px] font-medium text-[#4B5260] bg-[#FAF8F4] border border-[#E8E2D7] px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#552F8E]" />
                  {item.assignee_name}
                </span>
              )}
              {item.ai_confidence != null && (
                <span className="text-[10px] font-mono text-[#1C5465] bg-[#E6F5F9] border border-[#BCE3EB] px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3" /> {Math.round(item.ai_confidence * 100)}%
                </span>
              )}
            </div>
            <h3 className="font-bold text-[#252830] text-base">{item.title}</h3>
            {item.description && <p className="text-sm text-[#6D7584] mt-1 line-clamp-2 leading-relaxed">{item.description}</p>}
            {item.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.skills.map((s) => (
                  <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#FAF8F4] text-[#4B5260] border border-[#E8E2D7] font-medium">{s}</span>
                ))}
              </div>
            )}
            {item.acceptance_criteria?.length > 0 && (
              <ul className="mt-3 space-y-1 bg-[#FAF8F4]/80 border border-[#E8E2D7] rounded-xl p-3">
                {item.acceptance_criteria.map((a, i) => (
                  <li key={i} className="text-xs text-[#4B5260] flex gap-2"><Check className="w-3.5 h-3.5 text-[#2E5524] mt-0.5 shrink-0" /> {a}</li>
                ))}
              </ul>
            )}
            {item.dependencies?.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-[#8A92A0]">
                <GitCommitHorizontal className="w-3.5 h-3.5" /> depends on: <span className="text-[#552F8E] font-medium">{item.dependencies.map(titleOf).join(", ")}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2.5 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-[#F2EBFA] border border-[#D8C7F5] flex items-center justify-center font-display font-bold text-[#552F8E] text-base">
              {item.story_points}
            </div>
            <div className="flex gap-1">
              {item.status !== "approved" && (
                <button onClick={() => patch.mutate({ id: item.id, body: { status: "approved" } })}
                  data-testid={`approve-${item.id}`} title="Approve"
                  className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D7] hover:bg-[#EAF4E8] hover:border-[#C5E1A5] text-[#2E5524] flex items-center justify-center transition-all"><Check className="w-4 h-4" /></button>
              )}
              {item.status !== "rejected" && (
                <button onClick={() => patch.mutate({ id: item.id, body: { status: "rejected" } })}
                  data-testid={`reject-${item.id}`} title="Reject"
                  className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D7] hover:bg-[#FDE8E8] hover:border-[#F8B4B4] text-[#9B1C1C] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
              )}
              <button onClick={() => setEditing(item)} data-testid={`edit-${item.id}`} title="Edit"
                className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D7] hover:bg-[#F2EDE4] text-[#4B5260] flex items-center justify-center transition-all"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove.mutate(item.id)} data-testid={`delete-${item.id}`} title="Delete"
                className="w-7 h-7 rounded-lg bg-[#FAF8F4] border border-[#E8E2D7] hover:bg-[#FDE8E8] text-[#8A92A0] hover:text-[#9B1C1C] flex items-center justify-center transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const List = ({ type }) => {
    const filtered = items.filter((i) => i.type === type);
    if (filtered.length === 0)
      return <div className="text-center py-12 text-[#8A92A0] text-sm bg-white/60 rounded-2xl border border-dashed border-[#E8E2D7]">No {type}s yet.</div>;
    return <div className="space-y-3">{filtered.map((i) => <Card key={i.id} item={i} />)}</div>;
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#252830] flex items-center gap-2">
            <Layers className="w-7 h-7 text-[#552F8E]" /> Product Backlog
          </h1>
          <p className="text-[#6D7584] mt-1">Review, edit and approve the AI-generated backlog (human-in-the-loop).</p>
        </div>
        <Button onClick={() => approveAll.mutate()} data-testid="approve-all-button"
          className="bg-[#C5E1A5] hover:bg-[#B6D792] text-[#1F4216] font-semibold rounded-xl shadow-xs transition-all">
          {approveAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCheck className="w-4 h-4 mr-1.5" /> Approve all</>}
        </Button>
      </div>

      {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#552F8E] mx-auto mt-10" /> : (
        <Tabs defaultValue={items.some((i) => i.type === "story") ? "story" : "task"}>
          <TabsList className="bg-[#F2EDE4] border border-[#E8E2D7] p-1 rounded-2xl">
            <TabsTrigger value="epic" data-testid="tab-epics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#252830] data-[state=active]:shadow-xs">Epics ({items.filter((i) => i.type === "epic").length})</TabsTrigger>
            <TabsTrigger value="story" data-testid="tab-stories" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#252830] data-[state=active]:shadow-xs">Stories ({items.filter((i) => i.type === "story").length})</TabsTrigger>
            <TabsTrigger value="task" data-testid="tab-tasks" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#252830] data-[state=active]:shadow-xs">Tasks ({items.filter((i) => i.type === "task").length})</TabsTrigger>
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
      <DialogContent className="bg-white border-[#E8E2D7] text-[#252830] rounded-2xl shadow-lg">
        <DialogHeader><DialogTitle className="font-display text-xl font-bold text-[#252830]">Edit backlog item</DialogTitle></DialogHeader>
        {editing && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Title</Label>
              <Input value={val("title")} onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="edit-title-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Priority</Label>
                <Select value={val("priority")} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger data-testid="edit-priority-select" className="bg-[#FAF8F4] border-[#E8E2D7] text-[#252830] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[#E8E2D7] text-[#252830] rounded-xl">
                    {["Critical", "High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">AI points</Label>
                <Input type="number" value={val("story_points")} onChange={(e) => setForm({ ...form, story_points: Number(e.target.value) })}
                  data-testid="edit-points-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Expert points</Label>
                <Input type="number" value={val("expert_points")} onChange={(e) => setForm({ ...form, expert_points: Number(e.target.value) })}
                  data-testid="edit-expert-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] rounded-xl" />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button data-testid="save-edit-button" className="bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl"
            onClick={() => patch.mutate({ id: editing.id, body: form }, { onSuccess: () => { setEditing(null); setForm({}); } })}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
