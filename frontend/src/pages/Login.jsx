import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Loader2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("manager@sprintai.com");
  const [password, setPassword] = useState("Manager@123");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      nav("/projects");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#09090b]">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-zinc-800 grid-bg">
        <div className="flex items-center gap-2 text-white font-display font-bold text-xl">
          <GitBranch className="w-6 h-6 text-indigo-400" /> SprintForge
        </div>
        <div className="space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3" /> AI Sprint Intelligence
          </div>
          <h1 className="font-display text-5xl font-bold text-white leading-tight">
            From SRS document to an optimized sprint plan.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Upload requirements, let AI draft the backlog, then plan capacity-aware
            sprints that respect skills, dependencies and workload — and replan
            instantly when reality shifts.
          </p>
        </div>
        <div className="text-zinc-600 text-sm font-mono">Human-in-the-loop · Agile · Optimized</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6 fade-up" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-2 text-white font-display font-bold text-xl">
            <GitBranch className="w-6 h-6 text-indigo-400" /> SprintForge
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-white">Welcome back</h2>
            <p className="text-zinc-500 mt-1">Sign in to your planning workspace.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="login-email-input" className="bg-zinc-900 border-zinc-800 h-11" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password-input" className="bg-zinc-900 border-zinc-800 h-11" required />
          </div>
          <Button type="submit" disabled={loading} data-testid="login-submit-button"
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
          </Button>
          <p className="text-center text-sm text-zinc-500">
            No account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300" data-testid="go-register-link">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
