import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Profiles with their user_profiles (phone) and roles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      is_active,
      created_at,
      user_profiles ( phone ),
      user_roles ( role_id, roles ( id, name, level ) )
    `)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const staff = (profiles ?? []).map((p: any) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name ?? null,
    avatar_url: p.avatar_url ?? null,
    phone: p.user_profiles?.[0]?.phone ?? null,
    is_active: p.is_active ?? true,
    created_at: p.created_at,
    roles: (p.user_roles ?? []).map((ur: any) => ur.roles).filter(Boolean),
  }));

  return NextResponse.json({ staff });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, is_active, role_id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Toggle active status
  if (typeof is_active === "boolean") {
    const { error } = await supabase.from("profiles").update({ is_active }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Assign a role (replace all existing roles with one)
  if (role_id !== undefined) {
    await supabase.from("user_roles").delete().eq("user_id", id);
    if (role_id) {
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role_id, assigned_by: user.id });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
