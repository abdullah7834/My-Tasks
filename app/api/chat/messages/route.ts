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
          // No-op for route handlers.
        },
      },
    },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const roomId = url.searchParams.get("roomId");

  if (!roomId && !userId) {
    return NextResponse.json(
      { error: "User id is required." },
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

  let data;
  let error;

  if (roomId) {
    ({ data, error } = await supabase
      .from("chat_room_messages")
      .select("id,sender_id,room_id,message,created_at,read_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true }));
  } else {
    ({ data, error } = await supabase
      .from("chat_messages")
      .select("id,sender_id,recipient_id,message,created_at,read_at")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true }));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const recipientId = body.recipient_id?.toString();
  const roomId = body.room_id?.toString();
  const message = body.message?.toString()?.trim();

  if ((!recipientId && !roomId) || !message) {
    return NextResponse.json(
      { error: "Recipient and message are required." },
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

  type RoomMessageInsert = {
    room_id: string;
    sender_id: string;
    message: string;
  };

  type DirectMessageInsert = {
    recipient_id: string;
    sender_id: string;
    message: string;
  };

  let data: any;
  let error: any;

  if (roomId) {
    const insert: RoomMessageInsert = {
      room_id: roomId,
      sender_id: user.id,
      message,
    };
    ({ data, error } = await (supabase as any)
      .from("chat_room_messages")
        .insert([insert])
      .select("id,room_id,sender_id,message,created_at")
      .single());
  } else {
    const insert: DirectMessageInsert = {
      recipient_id: recipientId!,
      sender_id: user.id,
      message,
    };
    ({ data, error } = await (supabase as any)
      .from("chat_messages")
      .insert([insert])
        .select("id,sender_id,recipient_id,message,created_at,read_at")
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data ?? null });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const userId = body.user_id?.toString();
  const roomId = body.room_id?.toString();

  if (!userId && !roomId) {
    return NextResponse.json(
      { error: "user_id or room_id is required." },
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

  let error: any;

  if (userId) {
    const updatePayload = { read_at: new Date().toISOString() } as any;
    const { error: updateError } = await (supabase as any)
      .from("chat_messages")
      .update(updatePayload)
      .eq("sender_id", userId)
      .eq("recipient_id", user.id)
      .is("read_at", null);

    error = updateError;
  } else {
    const updatePayload = { read_at: new Date().toISOString() } as any;
    const { error: updateError } = await (supabase as any)
      .from("chat_room_messages")
      .update(updatePayload)
      .eq("room_id", roomId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    error = updateError;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
