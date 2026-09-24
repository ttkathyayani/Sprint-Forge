import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      nav("/projects");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF8F4] grid-bg">
      <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-3xl p-8 sm:p-10 shadow-sm fade-up">
        <form onSubmit={submit} className="space-y-6" data-testid="register-form">
          <div className="flex items-center gap-2.5 text-[#252830] font-display font-bold text-xl">
            <div className="w-8 h-8 rounded-xl bg-[#F2EBFA] border border-[#D8C7F5] flex items-center justify-center text-[#552F8E]">
              <GitBranch className="w-4 h-4" />
            </div>
            SprintForge
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-[#252830]">Create your workspace</h2>
            <p className="text-[#6D7584] mt-1.5 text-sm">Start planning smarter sprints.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="register-name-input"
              className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] h-11 rounded-xl transition-all" required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="register-email-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] h-11 rounded-xl transition-all" required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-[#6D7584]">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="register-password-input" className="bg-[#FAF8F4] border-[#E8E2D7] focus:border-[#D8C7F5] focus:bg-white text-[#252830] h-11 rounded-xl transition-all" minLength={6} required />
          </div>
          <Button type="submit" disabled={loading} data-testid="register-submit-button"
            className="w-full h-11 bg-[#D8C7F5] hover:bg-[#CDB8F2] text-[#3D1D70] font-semibold rounded-xl transition-all shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
          </Button>
          <p className="text-center text-sm text-[#6D7584]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#552F8E] font-medium hover:underline" data-testid="go-login-link">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
