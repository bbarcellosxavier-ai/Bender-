import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type SessionInfo = {
  userId: string;
  email: string | null;
  fullName: string;
  mustChangePassword: boolean;
  roles: string[];
  isStaff: boolean;
} | null;

export function useSessionInfo() {
  return useQuery<SessionInfo>({
    queryKey: ["session-info"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, must_change_password")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      const roleList = (roles ?? []).map((r) => r.role as string);
      return {
        userId: user.id,
        email: user.email ?? null,
        fullName: profile?.full_name ?? "",
        mustChangePassword: profile?.must_change_password ?? false,
        roles: roleList,
        isStaff: roleList.some((r) => r === "super_admin" || r === "personal"),
      };
    },
  });
}
