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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#09090b] grid-bg">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 fade-up" data-testid="register-form">
        <div className="flex items-center gap-2 text-white font-display font-bold text-xl">
          <GitBranch className="w-6 h-6 text-indigo-400" /> SprintForge
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold text-white">Create your workspace</h2>
          <p className="text-zinc-500 mt-1">Start planning smarter sprints.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="register-name-input"
            className="bg-zinc-900 border-zinc-800 h-11" required />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            data-testid="register-email-input" className="bg-zinc-900 border-zinc-800 h-11" required />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            data-testid="register-password-input" className="bg-zinc-900 border-zinc-800 h-11" minLength={6} required />
        </div>
        <Button type="submit" disabled={loading} data-testid="register-submit-button"
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
        </Button>
        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300" data-testid="go-login-link">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
