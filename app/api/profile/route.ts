import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient, ensureStorageBucket } from "@/lib/supabase/service";
import type { Database } from "@/types/supabase";

const AVATAR_BUCKET = "avatars";

function isFormFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "name" in value &&
    typeof (value as any).size === "number" &&
    typeof (value as any).name === "string"
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const full_name = formData.get("full_name")?.toString().trim() || null;
    const phone = formData.get("phone")?.toString().trim() || null;
    const timezone = formData.get("timezone")?.toString() || null;
    const role_id = formData.get("role_id")?.toString() || null;
    const avatarValue = formData.get("avatar");

    const supabase = await createSupabaseServerClient(request);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let avatar_url: string | null = null;

    if (isFormFile(avatarValue) && avatarValue.size > 0) {
    await ensureStorageBucket(AVATAR_BUCKET);

    const serviceSupabase = createSupabaseServiceClient();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: "Service role client is not configured." },
        { status: 500 },
      );
    }

    const safeFileName = avatarValue.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 200);
    const filePath = `user-profile/${user.id}/${Date.now()}-${safeFileName}`;

    const avatarBuffer = Buffer.from(await avatarValue.arrayBuffer());
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, avatarBuffer, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Avatar upload failed." },
        { status: 500 },
      );
    }

    if (!uploadData?.path) {
      return NextResponse.json(
        { error: "Avatar upload completed without a file path." },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = serviceSupabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(uploadData.path);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { error: "Failed to resolve public avatar URL." },
        { status: 500 },
      );
    }

    avatar_url = publicUrlData.publicUrl;
  }

  const profilePayload: Database["public"]["Tables"]["user_profiles"]["Insert"] = {
    user_id: user.id,
    full_name,
    phone,
    timezone,
    ...(avatar_url ? { avatar_url } : {}),
  };

  const profileClient = supabase as any;
  const { data: profileData, error: profileError } = await profileClient
    .from("user_profiles")
    .upsert([profilePayload], { onConflict: "user_id" })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (role_id) {
    const profileClient = supabase as any;
    const { error: roleError } = await profileClient
      .from("user_roles")
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    console.error("/api/profile error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
