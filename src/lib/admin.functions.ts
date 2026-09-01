import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(supabase: {
  from: (t: "user_roles") => any;
}, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const staff = (data ?? []).some(
    (r: { role: string }) => r.role === "super_admin" || r.role === "personal",
  );
  if (!staff) throw new Error("Acesso restrito ao personal.");
}

const accountSchema = z.object({
  studentId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6),
});

/** Cria a conta de acesso do aluno com senha temporária. */
export const createStudentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => accountSchema.parse(data))
  .handler(async ({ context, data }) => {
    await assertStaff(context.supabase as never, context.userId);

    const { data: student, error: studentError } = await context.supabase
      .from("students")
      .select("id, full_name, user_id")
      .eq("id", data.studentId)
      .maybeSingle();
    if (studentError) throw new Error(studentError.message);
    if (!student) throw new Error("Aluno não encontrado.");
    if (student.user_id) throw new Error("Este aluno já possui conta de acesso.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: student.full_name, must_change_password: true },
    });
    if (createError || !created.user) {
      throw new Error(createError?.message ?? "Não foi possível criar a conta.");
    }

    const newUserId = created.user.id;

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "aluno" });
    if (roleError) throw new Error(roleError.message);

    await supabaseAdmin
      .from("profiles")
      .update({ full_name: student.full_name, must_change_password: true })
      .eq("user_id", newUserId);

    const { error: linkError } = await supabaseAdmin
      .from("students")
      .update({ user_id: newUserId, email: data.email })
      .eq("id", data.studentId);
    if (linkError) throw new Error(linkError.message);

    return { ok: true as const };
  });

/** Redefine a senha do aluno e força nova troca no próximo acesso. */
export const resetStudentPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ studentId: z.string().uuid(), password: z.string().min(6) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context.supabase as never, context.userId);

    const { data: student, error } = await context.supabase
      .from("students")
      .select("user_id")
      .eq("id", data.studentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!student?.user_id) throw new Error("Este aluno ainda não tem conta de acesso.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(student.user_id, {
      password: data.password,
    });
    if (updateError) throw new Error(updateError.message);

    await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", student.user_id);

    return { ok: true as const };
  });
