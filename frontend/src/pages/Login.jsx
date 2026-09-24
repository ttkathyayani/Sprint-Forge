import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import SprintForgeLogo from "@/components/SprintForgeLogo";

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#FAF7F0]">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-[#EADBCC] grid-bg">
        <SprintForgeLogo size="md" />
        <div className="space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#9C4827] bg-[#FAF0E9] border border-[#F1D6C7] rounded-full px-3.5 py-1.5 font-medium shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#CD7A56]" /> AI Sprint Intelligence
          </div>
          <h1 className="font-display text-5xl font-bold text-[#2A352C] leading-[1.15] tracking-tight">
            From SRS document to an optimized sprint plan.
          </h1>
          <p className="text-[#5D675C] text-lg leading-relaxed">
            Upload requirements, let AI draft the backlog, then plan capacity-aware
            sprints that respect skills, dependencies and workload — and replan
            instantly when reality shifts.
          </p>
        </div>
        <div className="text-[#879385] text-sm font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#56654E]"></span>
          Human-in-the-loop · Agile Scrum · AI-Powered
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white border border-[#EADBCC] rounded-3xl p-8 sm:p-10 shadow-sm fade-up">
          <form onSubmit={submit} className="space-y-6" data-testid="login-form">
            <div className="lg:hidden mb-2">
              <SprintForgeLogo size="sm" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-[#2A352C]">Welcome back</h2>
              <p className="text-[#5D675C] mt-1.5 text-sm">Sign in to your planning workspace.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-[#5D675C]">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input" className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] h-11 rounded-xl transition-all" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-[#5D675C]">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input" className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] h-11 rounded-xl transition-all" required />
            </div>
            <Button type="submit" disabled={loading} data-testid="login-submit-button"
              className="w-full h-11 bg-[#56654E] hover:bg-[#46543F] text-[#FCF9F3] font-semibold rounded-xl transition-all shadow-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </Button>
            <p className="text-center text-sm text-[#5D675C]">
              No account?{" "}
              <Link to="/register" className="text-[#CD7A56] font-medium hover:underline" data-testid="go-register-link">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
