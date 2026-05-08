import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

const TASK_COLUMNS =
  "id,title,description,status,priority,due_date,start_time,end_time,total_time_minutes,project_id,position,created_at,updated_at";
const DEFAULT_PAGE_SIZE = 10;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const status = url.searchParams.get("status");
  const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const supabase = await createSupabaseServerClient(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  let query = supabase
    .from("tasks")
    .select(TASK_COLUMNS, { count: "exact" })
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tasks: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
  });
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

  const supabase = await createSupabaseServerClient(request);
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

  const { data, error } = await supabase
    .from("tasks")
    .insert([{
      title,
      description: body.description ?? null,
      project_id: projectId,
      status: body.status ?? "not_started",
      priority: body.priority ?? "none",
      due_date: body.due_date ?? null,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      total_time_minutes: body.total_time_minutes ?? 0,
      tags: body.tags ?? [],
      position: body.position ?? 0,
      user_id: user.id,
    }])
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

  const supabase = await createSupabaseServerClient(request);
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

  const updates: Database["public"]["Tables"]["tasks"]["Update"] = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.project_id !== undefined) updates.project_id = body.project_id;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.due_date !== undefined) updates.due_date = body.due_date;
  if (body.start_time !== undefined) updates.start_time = body.start_time;
  if (body.end_time !== undefined) updates.end_time = body.end_time;
  if (body.total_time_minutes !== undefined) updates.total_time_minutes = body.total_time_minutes;
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

  const supabase = await createSupabaseServerClient(request);
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
