import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, ClipboardPaste, Sparkles, Loader2, UploadCloud, CheckCircle2 } from "lucide-react";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import useSrsJobStatus from "@/hooks/useSrsJobStatus";

const SAMPLE = `The system shall allow users to register using their email address and password.
The system shall provide role-based access control.
Administrators shall be able to manage users.
The system shall allow users to securely log into the system.
The system shall support password reset via email.
The system shall let users create and manage projects.
The system shall generate analytics dashboards for project managers.`;

export default function SrsUpload() {
  const { pid } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const fileRef = useRef();

  const { job, isPolling } = useSrsJobStatus(
    pid, 
    jobId,
    (completedJob) => {
      setResult(completedJob.summary);
      qc.invalidateQueries({ queryKey: ["backlog", pid] });
      qc.invalidateQueries({ queryKey: ["requirements", pid] });
      toast.success("AI backlog generated");
    },
    (err) => {
      toast.error(err || "AI processing failed");
    }
  );

  const busy = isPolling;

  const start = async (request) => {
    setResult(null);
    try {
      const { data } = await request();
      setJobId(data.job_id);
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const runText = () => start(() => api.post(`/projects/${pid}/srs/text`, { text }));
  const runFile = (file) => {
    const fd = new FormData();
    fd.append("file", file);
    start(() => api.post(`/projects/${pid}/srs/upload`, fd));
  };

  return (
    <div className="space-y-8 fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          <FileUp className="w-7 h-7 text-cyan-400" /> SRS Processing
        </h1>
        <p className="text-zinc-500 mt-1">Upload a specification or paste requirements — AI extracts an Agile backlog.</p>
      </div>

      <Tabs defaultValue="text">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="text" data-testid="srs-tab-text"><ClipboardPaste className="w-4 h-4 mr-1" /> Paste text</TabsTrigger>
          <TabsTrigger value="file" data-testid="srs-tab-file"><UploadCloud className="w-4 h-4 mr-1" /> Upload file</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-5">
          <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 ${busy ? "ai-processing" : ""}`}>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} data-testid="srs-text-input"
              placeholder="Paste your SRS / requirements here…" rows={12}
              className="bg-zinc-950 border-zinc-800 font-mono text-sm resize-none" />
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setText(SAMPLE)} data-testid="srs-sample-button"
                className="text-xs text-cyan-400 hover:text-cyan-300">Load sample SRS</button>
              <Button disabled={busy || text.trim().length < 20} onClick={runText}
                data-testid="process-srs-text-button" className="bg-cyan-600 hover:bg-cyan-500 text-white">
                {busy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing…</> : <><Sparkles className="w-4 h-4 mr-1" /> Generate backlog</>}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="file" className="mt-5">
          <div onClick={() => !busy && fileRef.current?.click()} data-testid="srs-file-dropzone"
            className={`rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center cursor-pointer hover:border-cyan-500/50 transition-colors ${busy ? "ai-processing" : ""}`}>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden data-testid="srs-file-input"
              onChange={(e) => { if(e.target.files[0]) runFile(e.target.files[0]); }} />
            {busy ? <Loader2 className="w-10 h-10 mx-auto text-cyan-400 animate-spin" />
                  : <UploadCloud className="w-10 h-10 mx-auto text-zinc-600" />}
            <p className="text-white font-medium mt-4">
              {busy ? `Processing... ${job?.elapsed_seconds ? (job.elapsed_seconds + 's elapsed') : ''}` : "Drop a PDF or DOCX, or click to browse"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Supports .pdf, .docx, .txt</p>
          </div>
        </TabsContent>
      </Tabs>

      {result && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 fade-up" data-testid="srs-result">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-5 h-5" /> Backlog generated
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[["Requirements", result.requirements], ["Epics", result.epics], ["Stories", result.stories], ["Tasks", result.tasks]].map(([l, v]) => (
              <div key={l} className="text-center">
                <p className="text-3xl font-display font-bold text-white">{v}</p>
                <p className="text-xs text-zinc-500 uppercase font-mono">{l}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => nav(`../backlog`)} data-testid="go-review-backlog"
            className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white">Review the backlog →</Button>
        </div>
      )}
    </div>
  );
}
