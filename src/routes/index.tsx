import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell, Sun, Moon, LogIn, CheckCircle, ChevronRight, UserCheck, ShieldCheck, DumbbellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

export function IndexPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Verifica tema salvo ou padrão do sistema/elemento html
    const savedTheme = localStorage.getItem("theme");
    const isDarkMode = savedTheme 
      ? savedTheme === "dark" 
      : document.documentElement.classList.contains("dark");
    
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    // Verificar sessão atual no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Alternador de Tema Claro / Escuro
  function toggleTheme() {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Cabeçalho / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="font-black text-lg tracking-wider uppercase">Bender Personal</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de Trocar Tema */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleTheme} 
              title="Alternar Tema" 
              className="h-9 w-9 border-border bg-card hover:bg-accent"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-800" />}
            </Button>

            {loading ? null : session ? (
              <Button size="sm" onClick={() => navigate({ to: "/app" })} className="font-bold">
                <UserCheck className="h-4 w-4 mr-1.5" /> Meu Painel
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate({ to: "/auth" })} className="font-bold">
                <LogIn className="h-4 w-4 mr-1.5" /> Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20 space-y-16">
        <section className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Consultoria Online & Presencial
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Seu treino no nível máximo.
          </h1>

          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Plataforma exclusiva para alunos do Bender Personal. Treinos customizados, execuções em movimento e acompanhamento de evolução individual.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {session ? (
              <Button size="lg" className="w-full sm:w-auto font-bold text-base px-8" onClick={() => navigate({ to: "/app" })}>
                Acessar Meus Treinos <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            ) : (
              <Button size="lg" className="w-full sm:w-auto font-bold text-base px-8" onClick={() => navigate({ to: "/auth" })}>
                Área do Aluno <LogIn className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
        </section>

        {/* Recursos Principais */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <DumbbellIcon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Fichas Dinâmicas</h3>
            <p className="text-sm text-muted-foreground">
              Acesse suas fichas completas com séries, repetições e descanso definidos individualmente.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">GIFs em Movimento</h3>
            <p className="text-sm text-muted-foreground">
              Veja a execução perfeita de cada exercício em tempo real direto na sua tela durante o treino.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg">Gestão e Suporte</h3>
            <p className="text-sm text-muted-foreground">
              Painel integrado para ajuste rápido de cargas e atualização contínua do seu planejamento.
            </p>
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 Bender Personal. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}