import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Dumbbell, ArrowLeft, ShieldCheck, Zap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Erro ao entrar: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Login realizado com sucesso!");
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground">
      {/* Lado Esquerdo - Layout Visual e Benefícios */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-card via-background to-primary/10 border-r border-border relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <Dumbbell className="h-6 w-6" />
          </div>
          <span className="font-black text-xl tracking-wider">BENDER PERSONAL</span>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-black leading-tight">
            Evolua seus treinos com acompanhamento profissional.
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Acesse suas fichas personalizadas, acompanhe a execução correta dos exercícios e mantenha a consistência diária.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" /> Fichas 100% Personalizadas
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Zap className="h-5 w-5 text-primary" /> Demonstrações em GIF HD
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Award className="h-5 w-5 text-primary" /> Suporte Direto com o Personal
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 Bender Personal. Todos os direitos reservados.</p>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate({ to: "/" })}
          className="absolute top-6 left-6 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao início
        </Button>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-4 lg:hidden">
              <Dumbbell className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Acesse sua conta</h2>
            <p className="text-xs text-muted-foreground">Entre para ver seus treinos e fichas ativas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">E-mail</Label>
              <Input 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Senha</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Ainda não tem acesso? Fale com o seu personal.
          </p>
        </div>
      </div>
    </div>
  );
}