import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Dumbbell, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/student")({
  component: StudentDashboard,
});

export function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  
  // Controle do Cronômetro de Descanso
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Controle de Progresso das Séries e Cargas
  const [workoutProgress, setWorkoutProgress] = useState<Record<string, { sets: boolean[]; weight: string }>>({});

  useEffect(() => {
    fetchStudentWorkout();
  }, []);

  // Effect para contagem regressiva do timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false);
      toast.success("Tempo de descanso finalizado! Hora da próxima série.", {
        icon: <Volume2 className="h-5 w-5 text-primary" />,
      });
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  async function fetchStudentWorkout() {
    setLoading(true);
    
    const { data: workouts } = await supabase.from("workouts").select("*").limit(1);
    
    if (workouts && workouts.length > 0) {
      const workout = workouts[0];
      setActiveWorkout(workout);

      const { data: exData } = await supabase.from("exercises").select("*");
      if (exData) {
        setExercises(exData);
        
        const initialProg: Record<string, { sets: boolean[]; weight: string }> = {};
        exData.forEach((ex) => {
          initialProg[ex.id] = { sets: [false, false, false], weight: "" };
        });
        setWorkoutProgress(initialProg);
      }
    }
    setLoading(false);
  }

  const startTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setIsTimerActive(true);
  };

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setWorkoutProgress((prev) => {
      const current = prev[exerciseId] || { sets: [false, false, false], weight: "" };
      const newSets = [...current.sets];
      newSets[setIndex] = !newSets[setIndex];
      
      if (newSets[setIndex]) {
        startTimer(60);
      }

      return {
        ...prev,
        [exerciseId]: { ...current, sets: newSets },
      };
    });
  };

  const handleWeightChange = (exerciseId: string, weight: string) => {
    setWorkoutProgress((prev) => {
      const current = prev[exerciseId] || { sets: [false, false, false], weight: "" };
      return {
        ...prev,
        [exerciseId]: { ...current, weight },
      };
    });
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <p className="animate-pulse text-sm font-semibold">Carregando ficha de treino...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-32">
      {/* Top Header Mobile */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Ficha do Dia</span>
          <h1 className="text-base font-black uppercase">{activeWorkout?.name || "Treino Principal"}</h1>
        </div>
        <div className="w-9" />
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Banner do Treino */}
        <section className="rounded-2xl bg-gradient-to-br from-card via-card to-primary/10 p-5 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
              {activeWorkout?.focus || "Geral"}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5" /> {exercises.length} exercícios
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{activeWorkout?.description || "Execute com boa postura e controle de carga."}</p>
        </section>

        {/* Lista de Exercícios com Séries */}
        <section className="space-y-4">
          {exercises.map((ex, idx) => {
            const prog = workoutProgress[ex.id] || { sets: [false, false, false], weight: "" };
            const isCompleted = prog.sets.every(Boolean);

            return (
              <article 
                key={ex.id} 
                className={`rounded-2xl border transition-all p-4 space-y-4 ${
                  isCompleted ? "bg-primary/5 border-primary/30" : "bg-card border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <h2 className="font-bold text-base leading-tight">{ex.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{ex.instructions || "3 séries x 10 a 12 repetições"}</p>
                    </div>
                  </div>
                  {isCompleted && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                </div>

                {/* Input de Carga e Seletor de Séries */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                  <div className="w-28">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Carga (kg)</label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={prog.weight} 
                      onChange={(e) => handleWeightChange(ex.id, e.target.value)}
                      className="h-8 text-xs font-bold"
                    />
                  </div>

                  <div className="flex-1 flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Séries</span>
                    <div className="flex gap-2">
                      {prog.sets.map((done, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => toggleSet(ex.id, sIdx)}
                          className={`h-8 w-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                            done 
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30 scale-105" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          S{sIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {/* Widget Fixo do Cronômetro */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border p-4 shadow-2xl z-50">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Descanso</span>
              <span className="text-2xl font-black font-mono leading-none">{formatTime(timerSeconds)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => startTimer(30)}>30s</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => startTimer(60)}>60s</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => startTimer(90)}>90s</Button>
            
            <Button size="icon" className="h-8 w-8 ml-1" onClick={() => setIsTimerActive(!isTimerActive)}>
              {isTimerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setTimerSeconds(0); setIsTimerActive(false); }}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </main>
  );
}