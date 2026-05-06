import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ensureStorageBucket } from "@/lib/supabase/service";
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
          // No-op for API requests.
        },
      },
    },
  );
}

const AVATAR_BUCKET = "avatars";

export async function POST(request: Request) {
  const formData = await request.formData();
  const full_name = formData.get("full_name")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const timezone = formData.get("timezone")?.toString() || null;
  const role_id = formData.get("role_id")?.toString() || null;
  const avatarValue = formData.get("avatar");

  const supabase = createServerSupabaseClient(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let avatar_url: string | null = null;

  if (avatarValue instanceof File && avatarValue.size > 0) {
    await ensureStorageBucket(AVATAR_BUCKET);

    const safeFileName = avatarValue.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 200);
    const filePath = `user-profile/${user.id}/${Date.now()}-${safeFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, avatarValue, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Avatar upload failed." },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(uploadData.path);

    avatar_url = publicUrlData.publicUrl;
  }

  const profilePayload = {
    user_id: user.id,
    full_name,
    phone,
    timezone,
    ...(avatar_url ? { avatar_url } : {}),
  } as Database["public"]["Tables"]["user_profiles"]["Insert"];

  const { data: profileData, error: profileError } = await supabase
    .from<"user_profiles", Database["public"]["Tables"]["user_profiles"]["Insert"]>("user_profiles")
    .upsert([profilePayload], { onConflict: "user_id" })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (role_id) {
    const { error: roleError } = await supabase
      .from<"user_roles", Database["public"]["Tables"]["user_roles"]["Insert"]>("user_roles")
      .upsert(
        [
          {
            user_id: user.id,
            role_id,
            assigned_by: user.id,
          },
        ],
        { onConflict: "user_id,role_id" },
      );

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ profile: profileData });
}
