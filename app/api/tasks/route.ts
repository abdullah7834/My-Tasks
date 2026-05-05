import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

function createServerSupabaseClient(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const parsedCookies = cookieHeader
    .split("; ")
    .filter(Boolean)
    .map((cookie) => {
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
          // No-op for route handlers, as cookies are not updated here.
        },
      },
    },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  const supabase = createServerSupabaseClient(request);
  let query = supabase.from("tasks").select("id,title,status,priority,due_date,project_id").order("position", { ascending: true });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = body.title?.trim();
  const projectId = body.project_id;

  if (!title || !projectId) {
    return NextResponse.json({ error: "Task title and project_id are required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request);
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase.from("tasks").insert([
    {
      title,
      description: body.description ?? null,
      project_id: projectId,
      status: body.status ?? "not_started",
      priority: body.priority ?? "none",
      due_date: body.due_date ?? null,
      tags: body.tags ?? [],
      position: body.position ?? 0,
      user_id: session.user.id,
    },
  ] as any).select() as any;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data?.[0] ?? null });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const taskId = body.id;

  if (!taskId) {
    return NextResponse.json({ error: "Task id is required." }, { status: 400 });
  }

  const updates = {
    title: body.title?.trim(),
    description: body.description ?? null,
    project_id: body.project_id,
    status: body.status,
    priority: body.priority,
    due_date: body.due_date ?? null,
  } as any;

  const supabase = createServerSupabaseClient(request) as any;
  const { data, error } = await supabase.from("tasks").update(updates).eq("id", taskId).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data ?? null });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const taskId = url.searchParams.get("id");

  if (!taskId) {
    return NextResponse.json({ error: "Task id is required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request);
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
