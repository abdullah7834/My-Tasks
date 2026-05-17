import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, description, level, is_active, permission_ids } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = description;
  if (level !== undefined) updates.level = Number(level);
  if (typeof is_active === "boolean") updates.is_active = is_active;

  if (Object.keys(updates).length > 1) {
    const { error } = await supabase.from("roles").update(updates as any).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace permissions if provided
  if (Array.isArray(permission_ids)) {
    await supabase.from("role_permissions").delete().eq("role_id", id);
    if (permission_ids.length > 0) {
      const rows = permission_ids.map((pid: string) => ({ role_id: id, permission_id: pid }));
      const { error } = await supabase.from("role_permissions").insert(rows as any);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Block deletion of system roles
  const { data: role } = await supabase.from("roles").select("is_system").eq("id", id).maybeSingle();
  if (role?.is_system) return NextResponse.json({ error: "System roles cannot be deleted." }, { status: 403 });

  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
