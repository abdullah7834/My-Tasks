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

const TASK_COLUMNS =
  "id,title,description,status,priority,due_date,start_time,end_time,project_id,position,created_at,updated_at";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  const supabase = createServerSupabaseClient(request);
  let query = supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .order("position", { ascending: true });

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
    return NextResponse.json(
      { error: "Task title and project_id are required." },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const insert: any = {
    title,
    description: body.description ?? null,
    project_id: projectId,
    status: body.status ?? "not_started",
    priority: body.priority ?? "none",
    due_date: body.due_date ?? null,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    tags: body.tags ?? [],
    position: body.position ?? 0,
    user_id: user.id,
  };

  const { data, error } = await (supabase as any)
    .from("tasks")
    .insert([insert])
    .select(TASK_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data ?? null });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const taskId = body.id;

  if (!taskId) {
    return NextResponse.json(
      { error: "Task id is required." },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient(request) as any;
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  // Only include fields that were explicitly sent — partial update semantics.
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.project_id !== undefined) updates.project_id = body.project_id;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.due_date !== undefined) updates.due_date = body.due_date;
  if (body.start_time !== undefined) updates.start_time = body.start_time;
  if (body.end_time !== undefined) updates.end_time = body.end_time;
  if (body.position !== undefined) updates.position = body.position;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select(TASK_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data ?? null });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const taskId = url.searchParams.get("id");

  if (!taskId) {
    return NextResponse.json(
      { error: "Task id is required." },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
