import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

function createServerSupabaseClient(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const parsedCookies = cookieHeader
    .split("; ")
    .filter(Boolean)
    .map((cookie: string) => {
      const [name, ...rest] = cookie.split("=");
      return { name, value: rest.join("=") };
    });

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => parsedCookies,
        setAll: async () => {
          // No-op for route handlers.
        },
      },
    },
  );
}

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient(request);
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,icon,color,description")
    .order("created_at", { ascending: true }) as any;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        name,
        description: body.description ?? null,
        icon: body.icon ?? "",
        color: body.color ?? "#6366f1",
        user_id: user.id,
      },
    ] as any)
    .select() as any;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data?.[0] ?? null });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const projectId = body.id;

  if (!projectId) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request) as any;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const updates = {
    name: body.name?.trim(),
    description: body.description ?? null,
    icon: body.icon ?? null,
    color: body.color ?? null,
    user_id: user.id,
  } as any;

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project: data ?? null });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("id");

  if (!projectId) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request);
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}