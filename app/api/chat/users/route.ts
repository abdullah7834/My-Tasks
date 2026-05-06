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

  let users: Array<{ id: string; email: string }> = [];
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    const adminClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        cookies: {
          getAll: async () => [],
          setAll: async () => {
            // No-op for server-side admin client.
          },
        },
      },
    );

    const { data: adminData, error: adminError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (!adminError && adminData?.users) {
      users = adminData.users
        .filter((user: any) => user.email)
        .map((user: any) => ({ id: user.id, email: user.email }));
    }
  }

  if (users.length === 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email")
      .order("email", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    users = data ?? [];
  }

  return NextResponse.json({ users, current_user_id: user.id });
}
