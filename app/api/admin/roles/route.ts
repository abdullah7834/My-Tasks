import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: roles, error } = await supabase
    .from("roles")
    .select(`
      id, name, description, level, is_active, is_system, created_at,
      user_roles ( user_id ),
      role_permissions ( permission_id, permissions ( id, key, label, category ) )
    `)
    .order("level", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (roles ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    level: r.level,
    is_active: r.is_active,
    is_system: r.is_system,
    created_at: r.created_at,
    user_count: (r.user_roles ?? []).length,
    permission_count: (r.role_permissions ?? []).length,
    permissions: (r.role_permissions ?? []).map((rp: any) => rp.permissions).filter(Boolean),
  }));

  return NextResponse.json({ roles: result });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, level } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("roles")
    .insert({ name: name.trim(), description: description ?? null, level: level ?? 50, is_system: false })
    .select("id, name, description, level, is_active, is_system, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ role: { ...data, user_count: 0, permission_count: 0, permissions: [] } });
}
