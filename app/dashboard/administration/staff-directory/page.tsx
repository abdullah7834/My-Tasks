import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffDirectoryClient } from "@/components/administration/StaffDirectoryClient";

export const metadata = { title: "Staff Directory" };

export default async function StaffDirectoryPage() {
  const supabase = await createSupabaseServerClient();

  const [profilesRes, rolesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        id, email, full_name, avatar_url, is_active, created_at,
        user_profiles ( phone ),
        user_roles ( role_id, roles ( id, name, level ) )
      `)
      .order("created_at", { ascending: true }),
    supabase
      .from("roles")
      .select("id, name, level")
      .eq("is_active", true)
      .order("level", { ascending: false }),
  ]);

  const staff = (profilesRes.data ?? []).map((p: any) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name ?? null,
    avatar_url: p.avatar_url ?? null,
    phone: p.user_profiles?.[0]?.phone ?? null,
    is_active: p.is_active ?? true,
    created_at: p.created_at,
    roles: (p.user_roles ?? []).map((ur: any) => ur.roles).filter(Boolean),
  }));

  const allRoles = (rolesRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    level: r.level,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Staff Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage organization members, roles, and access.
        </p>
      </div>
      <StaffDirectoryClient initialStaff={staff} allRoles={allRoles} />
    </div>
  );
}
