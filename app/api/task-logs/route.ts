import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_EVENTS = [
  "start",
  "started",
  "resumed",
  "stopped_temporarily",
  "done",
  "cancelled",
] as const;

type TaskLogEvent = (typeof ALLOWED_EVENTS)[number];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json(
      { error: "Task id is required." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // Verify the task belongs to the requesting user before returning its logs.
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("task_logs")
    .select("id,task_id,event_type,event_at,duration_minutes,note,created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const taskId = body.task_id?.toString();
  const eventType = body.event_type?.toString();

  if (!taskId || !eventType) {
    return NextResponse.json(
      { error: "Task id and event_type are required." },
      { status: 400 },
    );
  }

  if (!ALLOWED_EVENTS.includes(eventType as TaskLogEvent)) {
    return NextResponse.json(
      { error: "Invalid event_type." },
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

  // Verify task ownership before inserting a log.
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("task_logs")
    .insert([{
      task_id: taskId,
      event_type: eventType,
      event_at: body.event_at ?? new Date().toISOString(),
      duration_minutes: body.duration_minutes ?? null,
      note: body.note ?? null,
    }])
    .select("id,task_id,event_type,event_at,duration_minutes,note,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ log: data ?? null });
}
