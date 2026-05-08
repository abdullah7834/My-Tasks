import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/dashboard/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileRes, rolesRes, roleRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("roles")
      .select("id,name")
      .order("name", { ascending: true }),
    supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = profileRes.data ?? null;
  const selectedRoleId = roleRes.data?.role_id ?? null;
  const roles = rolesRes.data ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-black/5">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
            Profile settings
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Personal account details
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage your personal profile information, upload an avatar, and select your primary work role.
          </p>
        </div>
      </div>

      <ProfileForm
        profile={{
          full_name: profile?.full_name ?? null,
          phone: profile?.phone ?? null,
          timezone: profile?.timezone ?? "UTC",
          avatar_url: profile?.avatar_url ?? null,
          selectedRoleId,
        }}
        roles={roles}
      />
    </div>
  );
}
