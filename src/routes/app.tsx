import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Dumbbell, 
  Users, 
  CreditCard, 
  LogOut, 
  Loader2, 
  ListCheck, 
  Plus, 
  Trash2, 
  ArrowLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ImageOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  component: AppPage,
});

export function AppPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"workouts" | "students" | "exercises" | "payments">("workouts");
  const [loading, setLoading] = useState(true);

  // Estados de dados
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<any[]>([]);
  const [studentWorkouts, setStudentWorkouts] = useState<any[]>([]);

  // Estado para Montador de Treino (Treino Selecionado)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [loadingWorkoutExercises, setLoadingWorkoutExercises] = useState(false);

  // Estado para Atribuição de Treino ao Aluno
  const [selectedStudentForWorkout, setSelectedStudentForWorkout] = useState<any>(null);
  const [assignedWorkoutId, setAssignedWorkoutId] = useState<string>("");

  // Estado para Visualizar/Editar Exercício Selecionado (Modal)
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [modalImgError, setModalImgError] = useState(false);

  // Formulário de adicionar exercício ao treino selecionado
  const [addExToWorkout, setAddExToWorkout] = useState({ exercise_id: "", sets: 3, reps: "10-12" });

  // Estados dos Formulários de Criação
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: "", focus: "", description: "" });
  const [newExercise, setNewExercise] = useState({ name: "", difficulty: "Iniciante", instructions: "", media_url: "", muscle_group_id: "" });
  const [newStudent, setNewStudent] = useState({ email: "", full_name: "" });

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    const [wRes, sRes, eRes, pRes, mgRes, swRes] = await Promise.all([
      supabase.from("workouts").select("*"),
      supabase.from("students").select("*"),
      supabase.from("exercises").select("*"),
      supabase.from("payments").select("*"),
      supabase.from("muscle_groups").select("*"),
      supabase.from("student_workouts").select("*, workouts(*)"),
    ]);

    if (wRes.data) setWorkouts(wRes.data);
    if (sRes.data) setStudents(sRes.data);
    if (eRes.data) setExercises(eRes.data);
    if (pRes.data) setPayments(pRes.data);
    if (swRes.data) setStudentWorkouts(swRes.data);
    if (mgRes.data && mgRes.data.length > 0) {
      setMuscleGroups(mgRes.data);
      const firstMgId = mgRes.data[0]?.id || "";
      setNewExercise((prev) => ({ ...prev, muscle_group_id: firstMgId }));
    }

    setLoading(false);
  }

  // Carregar os exercícios vinculados a um treino específico
  async function loadWorkoutExercises(workoutId: string) {
    setLoadingWorkoutExercises(true);
    const { data, error } = await supabase
      .from("workout_exercises")
      .select("*, exercises(*)")
      .eq("workout_id", workoutId)
      .order("position", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar exercícios do treino: " + error.message);
    } else {
      setWorkoutExercises(data || []);
    }
    setLoadingWorkoutExercises(false);
  }

  function handleSelectWorkout(workout: any) {
    setSelectedWorkout(workout);
    if (exercises.length > 0) {
      setAddExToWorkout((prev) => ({ ...prev, exercise_id: exercises[0].id }));
    }
    loadWorkoutExercises(workout.id);
  }

  // Adicionar exercício na ficha do treino
  async function handleAddExerciseToWorkout() {
    if (!selectedWorkout || !addExToWorkout.exercise_id) return;

    const newPosition = workoutExercises.length + 1;

    const { error } = await supabase.from("workout_exercises").insert([
      {
        workout_id: selectedWorkout.id,
        exercise_id: addExToWorkout.exercise_id,
        sets: Number(addExToWorkout.sets),
        reps: addExToWorkout.reps,
        position: newPosition,
      },
    ] as any);

    if (error) {
      toast.error("Erro ao vincular exercício: " + error.message);
      return;
    }

    toast.success("Exercício adicionado ao treino!");
    loadWorkoutExercises(selectedWorkout.id);
  }

  // Remover exercício da ficha do treino
  async function handleRemoveExerciseFromWorkout(workoutExerciseId: string) {
    const { error } = await supabase.from("workout_exercises").delete().eq("id", workoutExerciseId);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
      return;
    }
    toast.success("Exercício removido do treino!");
    if (selectedWorkout) loadWorkoutExercises(selectedWorkout.id);
  }

  // Abrir Modal de Edição de Exercício
  function handleOpenEditModal(ex: any) {
    setEditingExercise(ex);
    setModalImgError(false);
  }

  // Salvar edições do Exercício no Modal
  async function handleUpdateExercise() {
    if (!editingExercise) return;

    const { error } = await supabase
      .from("exercises")
      .update({
        name: editingExercise.name,
        instructions: editingExercise.instructions,
        media_url: editingExercise.media_url,
        difficulty: editingExercise.difficulty,
      } as any)
      .eq("id", editingExercise.id);

    if (error) {
      toast.error("Erro ao atualizar exercício: " + error.message);
      return;
    }

    toast.success("Exercício atualizado!");
    setEditingExercise(null);
    loadAllData();
  }

  // Vincular treino a um aluno
  async function handleAssignWorkoutToStudent() {
    if (!selectedStudentForWorkout || !assignedWorkoutId) {
      toast.error("Selecione um treino para vincular ao aluno");
      return;
    }

    await supabase.from("student_workouts").delete().eq("student_id", selectedStudentForWorkout.id);

    const { error } = await supabase.from("student_workouts").insert([
      {
        student_id: selectedStudentForWorkout.id,
        workout_id: assignedWorkoutId,
      },
    ] as any);

    if (error) {
      toast.error("Erro ao vincular treino: " + error.message);
      return;
    }

    toast.success("Treino atribuído ao aluno com sucesso!");
    setSelectedStudentForWorkout(null);
    loadAllData();
  }

  // --- Funções de Criação ---
  async function handleCreate() {
    if (activeTab === "workouts") {
      if (!newWorkout.name) {
        toast.error("Preencha o nome do treino");
        return;
      }
      const { error } = await supabase.from("workouts").insert([newWorkout] as any);
      if (error) {
        toast.error("Erro ao criar treino: " + error.message);
        return;
      }
      toast.success("Treino criado com sucesso!");
      setNewWorkout({ name: "", focus: "", description: "" });
    } else if (activeTab === "exercises") {
      if (!newExercise.name) {
        toast.error("Preencha o nome do exercício");
        return;
      }
      if (!newExercise.muscle_group_id) {
        toast.error("Selecione um grupo muscular");
        return;
      }
      const { error } = await supabase.from("exercises").insert([newExercise] as any);
      if (error) {
        toast.error("Erro ao criar exercício: " + error.message);
        return;
      }
      toast.success("Exercício criado com sucesso!");
      const fallbackId = muscleGroups[0]?.id || "";
      setNewExercise({ name: "", difficulty: "Iniciante", instructions: "", media_url: "", muscle_group_id: fallbackId });
    } else if (activeTab === "students") {
      if (!newStudent.email) {
        toast.error("Preencha o e-mail do aluno");
        return;
      }
      const { error } = await supabase.from("students").insert([newStudent] as any);
      if (error) {
        toast.error("Erro ao cadastrar aluno: " + error.message);
        return;
      }
      toast.success("Aluno cadastrado com sucesso!");
      setNewStudent({ email: "", full_name: "" });
    }

    setShowAddForm(false);
    loadAllData();
  }

  async function handleDelete(table: "workouts" | "students" | "exercises" | "payments", id: string) {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return;
    }
    toast.success("Item removido!");
    loadAllData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Cabeçalho */}
        <header className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate({ to: "/" })} title="Ir para Home">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Painel Admin</span>
              <h1 className="text-xl font-black uppercase">Bender Personal</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair da Conta">
            <LogOut className="h-5 w-5 text-destructive" />
          </Button>
        </header>

        {/* Barra de Navegação */}
        <div className="flex items-center justify-between my-4 gap-2 flex-wrap">
          <nav className="flex gap-2 overflow-x-auto">
            <Button
              variant={activeTab === "workouts" ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveTab("workouts"); setShowAddForm(false); setSelectedWorkout(null); setSelectedStudentForWorkout(null); }}
            >
              <Dumbbell className="h-4 w-4 mr-1" /> Treinos ({workouts.length})
            </Button>
            <Button
              variant={activeTab === "students" ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveTab("students"); setShowAddForm(false); setSelectedWorkout(null); setSelectedStudentForWorkout(null); }}
            >
              <Users className="h-4 w-4 mr-1" /> Alunos ({students.length})
            </Button>
            <Button
              variant={activeTab === "exercises" ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveTab("exercises"); setShowAddForm(false); setSelectedWorkout(null); setSelectedStudentForWorkout(null); }}
            >
              <ListCheck className="h-4 w-4 mr-1" /> Exercícios ({exercises.length})
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveTab("payments"); setShowAddForm(false); setSelectedWorkout(null); setSelectedStudentForWorkout(null); }}
            >
              <CreditCard className="h-4 w-4 mr-1" /> Pagamentos ({payments.length})
            </Button>
          </nav>

          {activeTab !== "payments" && !selectedWorkout && !selectedStudentForWorkout && (
            <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          )}
        </div>

        {/* Modal para Visualizar / Editar Exercício ao Clicar */}
        {editingExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" /> Editar Exercício
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingExercise(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Demonstração do GIF Animado Ampliado com Tratamento de Erro */}
              <div className="flex flex-col items-center justify-center bg-neutral-900 p-3 rounded-xl border border-neutral-800 min-h-[160px]">
                {editingExercise.media_url && !modalImgError ? (
                  <img 
                    src={editingExercise.media_url} 
                    alt={editingExercise.name} 
                    className="max-h-48 w-full object-contain rounded-lg"
                    onError={() => setModalImgError(true)}
                  />
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <ImageOff className="h-8 w-8 text-muted-foreground opacity-60" />
                    <span>Imagem ou GIF indisponível / link quebrado</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Nome do Exercício</Label>
                  <Input 
                    value={editingExercise.name || ""} 
                    onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })} 
                  />
                </div>

                <div>
                  <Label className="text-xs">URL do GIF Animado / Imagem</Label>
                  <Input 
                    value={editingExercise.media_url || ""} 
                    onChange={(e) => {
                      setEditingExercise({ ...editingExercise, media_url: e.target.value });
                      setModalImgError(false);
                    }} 
                    placeholder="https://exemplo.com/exercicio.gif"
                  />
                </div>

                <div>
                  <Label className="text-xs">Instruções de Execução</Label>
                  <Input 
                    value={editingExercise.instructions || ""} 
                    onChange={(e) => setEditingExercise({ ...editingExercise, instructions: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingExercise(null)}>Cancelar</Button>
                <Button size="sm" onClick={handleUpdateExercise}>Salvar Alterações</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Atribuição de Treino ao Aluno */}
        {selectedStudentForWorkout && (
          <section className="mb-6 rounded-2xl border border-primary/50 bg-card p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Atribuir Ficha ao Aluno</span>
                <h2 className="text-lg font-bold">{selectedStudentForWorkout.full_name || selectedStudentForWorkout.email}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedStudentForWorkout(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase">Selecione o Treino Ativo</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                value={assignedWorkoutId}
                onChange={(e) => setAssignedWorkoutId(e.target.value)}
              >
                <option value="">-- Escolha um treino --</option>
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.focus})</option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForWorkout(null)}>Cancelar</Button>
                <Button size="sm" onClick={handleAssignWorkoutToStudent}>Salvar Atribuição</Button>
              </div>
            </div>
          </section>
        )}

        {/* Montador de Treino Selecionado */}
        {selectedWorkout && (
          <section className="mb-6 rounded-2xl border border-primary/50 bg-card p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Montando Ficha de Treino</span>
                <h2 className="text-xl font-black">{selectedWorkout.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedWorkout.focus} • {selectedWorkout.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedWorkout(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-3">
              <span className="text-xs font-bold uppercase text-foreground">Adicionar Exercício a este Treino</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium"
                    value={addExToWorkout.exercise_id}
                    onChange={(e) => setAddExToWorkout({ ...addExToWorkout, exercise_id: e.target.value })}
                  >
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Input 
                    type="number" 
                    placeholder="Séries" 
                    value={addExToWorkout.sets} 
                    onChange={(e) => setAddExToWorkout({ ...addExToWorkout, sets: Number(e.target.value) })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input 
                    placeholder="Reps (ex: 10-12)" 
                    value={addExToWorkout.reps} 
                    onChange={(e) => setAddExToWorkout({ ...addExToWorkout, reps: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button size="sm" className="w-full h-9 text-xs" onClick={handleAddExerciseToWorkout}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista dos Exercícios na Ficha de Treino */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Ficha Atual ({workoutExercises.length} Exercícios)</h3>
              {loadingWorkoutExercises ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : workoutExercises.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6 border border-dashed rounded-xl">
                  Nenhum exercício adicionado a este treino ainda.
                </p>
              ) : (
                workoutExercises.map((we, index) => (
                  <div key={we.id} className="flex items-center justify-between bg-background p-3 rounded-xl border border-border">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => handleOpenEditModal(we.exercises)}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                        {index + 1}
                      </span>
                      {we.exercises?.media_url ? (
                        <img 
                          src={we.exercises.media_url} 
                          alt={we.exercises?.name} 
                          className="h-14 w-14 object-cover rounded-lg border border-primary/20 shrink-0 bg-neutral-900" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = "h-14 w-14 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground shrink-0 border border-border";
                              fallback.innerHTML = '<svg class="lucide lucide-image-off h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="13.5" y1="13.5" y2="13.5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground shrink-0 border border-border">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                          {we.exercises?.name}
                          <Pencil className="h-3 w-3 text-muted-foreground opacity-60" />
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {we.sets} séries x {we.reps} reps
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveExerciseFromWorkout(we.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Formulários de Criação */}
        {showAddForm && (
          <section className="mb-6 rounded-xl border border-primary/40 bg-card p-4 space-y-4 shadow-lg">
            <h3 className="font-bold text-sm uppercase text-primary">
              Cadastrar em {activeTab === "workouts" ? "Treinos" : activeTab === "exercises" ? "Exercícios" : "Alunos"}
            </h3>

            {activeTab === "workouts" && (
              <div className="space-y-3">
                <div>
                  <Label>Nome do Treino</Label>
                  <Input value={newWorkout.name} onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })} placeholder="Ex: Treino A" />
                </div>
                <div>
                  <Label>Foco / Grupos Musculares</Label>
                  <Input value={newWorkout.focus} onChange={(e) => setNewWorkout({ ...newWorkout, focus: e.target.value })} placeholder="Ex: Peitoral e Tríceps" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input value={newWorkout.description} onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })} placeholder="Orientação geral para o aluno" />
                </div>
              </div>
            )}

            {activeTab === "exercises" && (
              <div className="space-y-3">
                <div>
                  <Label>Nome do Exercício</Label>
                  <Input value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} placeholder="Ex: Supino Reto com Barra" />
                </div>
                <div>
                  <Label>Grupo Muscular</Label>
                  <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newExercise.muscle_group_id} 
                    onChange={(e) => setNewExercise({ ...newExercise, muscle_group_id: e.target.value })}
                  >
                    {muscleGroups.map((mg) => (
                      <option key={mg.id} value={mg.id}>{mg.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Link do GIF / Imagem (URL)</Label>
                  <Input 
                    value={newExercise.media_url} 
                    onChange={(e) => setNewExercise({ ...newExercise, media_url: e.target.value })} 
                    placeholder="https://exemplo.com/exercicio.gif" 
                  />
                </div>
                <div>
                  <Label>Instruções de Execução</Label>
                  <Input value={newExercise.instructions} onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })} placeholder="Instruções de postura" />
                </div>
              </div>
            )}

            {activeTab === "students" && (
              <div className="space-y-3">
                <div>
                  <Label>E-mail do Aluno</Label>
                  <Input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="aluno@email.com" />
                </div>
                <div>
                  <Label>Nome Completo do Aluno</Label>
                  <Input value={newStudent.full_name} onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })} placeholder="Nome completo" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCreate}>Salvar Registro</Button>
            </div>
          </section>
        )}

        {/* Lista de Exercícios na Aba Exercícios */}
        <section className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {activeTab === "workouts" && workouts.map((w) => (
                <article key={w.id} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex-1" onClick={() => handleSelectWorkout(w)}>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-primary">{w.name}</h2>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">{w.focus}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
                    <span className="inline-flex items-center text-xs text-primary font-semibold mt-2">
                      Montar / Editar Ficha <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete("workouts", w.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </article>
              ))}

              {activeTab === "students" && (
                students.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum aluno cadastrado. Clique em "+ Novo" para cadastrar.</p>
                ) : (
                  students.map((s) => {
                    const assignedSW = studentWorkouts.find((sw) => sw.student_id === s.id);
                    const currentWorkout = assignedSW?.workouts;

                    return (
                      <article key={s.id} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center">
                        <div className="space-y-1">
                          <h2 className="text-base font-bold">{s.full_name || "Aluno sem nome"}</h2>
                          <p className="text-xs text-muted-foreground">{s.email}</p>

                          <div className="pt-1 flex items-center gap-2">
                            {currentWorkout ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" /> Ficha: {currentWorkout.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">
                                <AlertCircle className="h-3 w-3" /> Sem Treino
                              </span>
                            )}
                            
                            <button
                              onClick={() => {
                                setSelectedStudentForWorkout(s);
                                setAssignedWorkoutId(currentWorkout?.id || "");
                              }}
                              className="text-xs text-primary underline font-medium hover:text-primary/80"
                            >
                              {currentWorkout ? "Alterar Treino" : "Atribuir Treino"}
                            </button>
                          </div>
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => handleDelete("students", s.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </article>
                    );
                  })
                )
              )}

              {/* Lista de Exercícios Clicáveis */}
              {activeTab === "exercises" && exercises.map((e) => (
                <article 
                  key={e.id} 
                  className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div 
                    className="flex items-center gap-3 flex-1"
                    onClick={() => handleOpenEditModal(e)}
                  >
                    {e.media_url ? (
                      <img 
                        src={e.media_url} 
                        alt={e.name} 
                        className="h-14 w-14 object-cover rounded-lg border border-primary/30 shrink-0 bg-neutral-900" 
                        onError={(evt) => {
                          (evt.target as HTMLElement).style.display = 'none';
                          const parent = (evt.target as HTMLElement).parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = "h-14 w-14 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground shrink-0 border border-border";
                            fallback.innerHTML = '<svg class="lucide lucide-image-off h-6 w-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="13.5" y1="13.5" y2="13.5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground shrink-0 border border-border">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold flex items-center gap-1.5">
                          {e.name}
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                        </h2>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{e.difficulty}</span>
                      </div>
                      {e.instructions && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{e.instructions}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete("exercises", e.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </article>
              ))}

              {activeTab === "payments" && payments.map((p) => (
                <article key={p.id} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold">Mês Referência: {p.reference_month}</p>
                    <p className="text-xs text-muted-foreground">Vencimento: {p.due_date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${p.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {p.status}
                  </span>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </main>
  );
}