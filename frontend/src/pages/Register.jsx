import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import SprintForgeLogo from "@/components/SprintForgeLogo";

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF7F0] grid-bg">
      <div className="w-full max-w-md bg-white border border-[#EADBCC] rounded-3xl p-8 sm:p-10 shadow-sm fade-up">
        <form onSubmit={submit} className="space-y-6" data-testid="register-form">
          <SprintForgeLogo size="md" />
          <div>
            <h2 className="font-display text-3xl font-bold text-[#2A352C]">Create your workspace</h2>
            <p className="text-[#5D675C] mt-1.5 text-sm">Start planning smarter sprints.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-[#5D675C]">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="register-name-input"
              className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] h-11 rounded-xl transition-all" required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-[#5D675C]">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="register-email-input" className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] h-11 rounded-xl transition-all" required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-[#5D675C]">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              data-testid="register-password-input" className="bg-[#FAF7F0] border-[#EADBCC] focus:border-[#56654E] focus:bg-white text-[#2A352C] h-11 rounded-xl transition-all" minLength={6} required />
          </div>
          <Button type="submit" disabled={loading} data-testid="register-submit-button"
            className="w-full h-11 bg-[#56654E] hover:bg-[#46543F] text-[#FCF9F3] font-semibold rounded-xl transition-all shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
          </Button>
          <p className="text-center text-sm text-[#5D675C]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#CD7A56] font-medium hover:underline" data-testid="go-login-link">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
