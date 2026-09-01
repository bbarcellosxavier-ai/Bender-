import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StudentWorkoutSummary = {
  id: string;
  workoutId: string;
  name: string;
  focus: string | null;
  position: number;
  exerciseCount: number;
};

export type StudentHome = {
  fullName: string;
  studentId: string | null;
  status: string | null;
  blocked: boolean;
  workouts: StudentWorkoutSummary[];
};

/** Bloqueio calculado no servidor: vencido + dias de tolerância. */
function isOverdue(dueDate: string, graceDays: number) {
  const limit = new Date(`${dueDate}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + graceDays);
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  return todayUtc.getTime() > limit.getTime();
}

export const getStudentHome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentHome> => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, status, grace_days")
      .eq("user_id", userId)
      .maybeSingle();
    if (studentError) throw new Error(studentError.message);

    if (!student) {
      return {
        fullName: profile?.full_name ?? "",
        studentId: null,
        status: null,
        blocked: false,
        workouts: [],
      };
    }

    const { data: payments } = await supabase
      .from("payments")
      .select("due_date, status")
      .eq("student_id", student.id)
      .neq("status", "pago");

    const blocked =
      student.status !== "ativo" ||
      (payments ?? []).some((p) => isOverdue(p.due_date, student.grace_days));

    if (blocked) {
      return {
        fullName: profile?.full_name ?? "",
        studentId: student.id,
        status: student.status,
        blocked: true,
        workouts: [],
      };
    }

    const { data: assignments, error: assignmentError } = await supabase
      .from("student_workouts")
      .select("id, position, workout_id, workouts(id, name, focus, workout_exercises(id))")
      .eq("student_id", student.id)
      .eq("active", true)
      .order("position", { ascending: true });
    if (assignmentError) throw new Error(assignmentError.message);

    const workouts: StudentWorkoutSummary[] = (assignments ?? [])
      .filter((a) => a.workouts)
      .map((a) => ({
        id: a.id,
        workoutId: a.workout_id,
        name: a.workouts!.name,
        focus: a.workouts!.focus,
        position: a.position,
        exerciseCount: a.workouts!.workout_exercises?.length ?? 0,
      }));

    return {
      fullName: profile?.full_name ?? "",
      studentId: student.id,
      status: student.status,
      blocked: false,
      workouts,
    };
  });

export type WorkoutExerciseDetail = {
  id: string;
  position: number;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string | null;
  name: string;
  instructions: string;
  mediaUrl: string | null;
  muscleGroup: string;
};

export const getWorkoutDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ workoutId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const { data: workout, error } = await supabase
      .from("workouts")
      .select("id, name, focus, description")
      .eq("id", data.workoutId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!workout) throw new Error("Treino não encontrado ou não liberado para você.");

    const { data: items, error: itemsError } = await supabase
      .from("workout_exercises")
      .select(
        "id, position, sets, reps, rest_seconds, notes, exercises(name, instructions, media_url, muscle_groups(name))",
      )
      .eq("workout_id", data.workoutId)
      .order("position", { ascending: true });
    if (itemsError) throw new Error(itemsError.message);

    const exercises: WorkoutExerciseDetail[] = (items ?? [])
      .filter((i) => i.exercises)
      .map((i) => ({
        id: i.id,
        position: i.position,
        sets: i.sets,
        reps: i.reps,
        restSeconds: i.rest_seconds,
        notes: i.notes,
        name: i.exercises!.name,
        instructions: i.exercises!.instructions,
        mediaUrl: i.exercises!.media_url,
        muscleGroup: i.exercises!.muscle_groups?.name ?? "",
      }));

    return { workout, exercises };
  });
