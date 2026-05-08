import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RolesPermissionsClient } from "@/components/administration/RolesPermissionsClient";

export const metadata = { title: "Roles & Permissions" };

export default async function RolesPermissionsPage() {
  const supabase = await createSupabaseServerClient();

  const [rolesRes, permsRes] = await Promise.all([
    supabase
      .from("roles")
      .select(`
        id, name, description, level, is_active, is_system, created_at,
        user_roles ( user_id ),
        role_permissions ( permission_id, permissions ( id, key, label, category ) )
      `)
      .order("level", { ascending: false }),
    supabase
      .from("permissions")
      .select("id, key, label, category")
      .order("category")
      .order("label"),
  ]);

  const roles = (rolesRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    level: r.level,
    is_active: r.is_active,
    is_system: r.is_system,
    created_at: r.created_at,
    user_count: (r.user_roles ?? []).length,
    permission_count: (r.role_permissions ?? []).length,
    permissions: (r.role_permissions ?? []).map((rp: any) => rp.permissions).filter(Boolean),
  }));

  const allPermissions = (permsRes.data ?? []).map((p: any) => ({
    id: p.id,
    key: p.key,
    label: p.label,
    category: p.category,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define roles and control what each role can access.
        </p>
      </div>
      <RolesPermissionsClient initialRoles={roles} allPermissions={allPermissions} />
    </div>
  );
}
