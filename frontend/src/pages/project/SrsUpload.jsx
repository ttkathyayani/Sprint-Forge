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
        <h1 className="font-display text-3xl font-bold text-[#252830] flex items-center gap-2">
          <FileUp className="w-7 h-7 text-[#1C5465]" /> SRS Processing
        </h1>
        <p className="text-[#6D7584] mt-1">Upload a specification or paste requirements — AI extracts an Agile backlog.</p>
      </div>

      <Tabs defaultValue="text">
        <TabsList className="bg-[#F2EDE4] border border-[#E8E2D7] p-1 rounded-2xl">
          <TabsTrigger value="text" data-testid="srs-tab-text" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#252830] data-[state=active]:shadow-xs">
            <ClipboardPaste className="w-4 h-4 mr-1.5" /> Paste text
          </TabsTrigger>
          <TabsTrigger value="file" data-testid="srs-tab-file" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#252830] data-[state=active]:shadow-xs">
            <UploadCloud className="w-4 h-4 mr-1.5" /> Upload file
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-5">
          <div className={`rounded-3xl border border-[#E8E2D7] bg-white p-6 shadow-xs ${busy ? "ai-processing" : ""}`}>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} data-testid="srs-text-input"
              placeholder="Paste your SRS / requirements here…" rows={12}
              className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] font-mono text-sm resize-none rounded-2xl p-4 transition-all" />
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => setText(SAMPLE)} data-testid="srs-sample-button"
                className="text-xs text-[#1C5465] font-semibold hover:underline">Load sample SRS</button>
              <Button disabled={busy || text.trim().length < 20} onClick={runText}
                data-testid="process-srs-text-button" className="bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl shadow-xs transition-all">
                {busy ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processing…</> : <><Sparkles className="w-4 h-4 mr-1.5" /> Generate backlog</>}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="file" className="mt-5">
          <div onClick={() => !busy && fileRef.current?.click()} data-testid="srs-file-dropzone"
            className={`rounded-3xl border-2 border-dashed border-[#BCE3EB] bg-[#F3FAFC] hover:bg-[#E6F5F9] p-12 text-center cursor-pointer transition-all ${busy ? "ai-processing" : ""}`}>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden data-testid="srs-file-input"
              onChange={(e) => { if(e.target.files[0]) runFile(e.target.files[0]); }} />
            {busy ? <Loader2 className="w-12 h-12 mx-auto text-[#1C5465] animate-spin" />
                  : <UploadCloud className="w-12 h-12 mx-auto text-[#1C5465]" />}
            <p className="text-[#252830] font-bold text-base mt-4">
              {busy ? `Processing... ${job?.elapsed_seconds ? (job.elapsed_seconds + 's elapsed') : ''}` : "Drop a PDF or DOCX, or click to browse"}
            </p>
            <p className="text-xs text-[#6D7584] mt-1.5">Supports .pdf, .docx, .txt</p>
          </div>
        </TabsContent>
      </Tabs>

      {result && (
        <div className="rounded-3xl border border-[#C5E1A5] bg-[#F5FAF3] p-7 shadow-xs fade-up" data-testid="srs-result">
          <div className="flex items-center gap-2 text-[#2E5524] font-bold">
            <CheckCircle2 className="w-5 h-5" /> Backlog generated
          </div>
          <div className="grid grid-cols-4 gap-4 mt-5">
            {[["Requirements", result.requirements], ["Epics", result.epics], ["Stories", result.stories], ["Tasks", result.tasks]].map(([l, v]) => (
              <div key={l} className="text-center bg-white border border-[#D7ECD2] rounded-2xl py-3.5 shadow-xs">
                <p className="text-3xl font-display font-bold text-[#252830]">{v}</p>
                <p className="text-xs text-[#6D7584] uppercase font-mono mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => nav(`../backlog`)} data-testid="go-review-backlog"
            className="mt-6 bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl shadow-xs">Review the backlog →</Button>
        </div>
      )}
    </div>
  );
}
