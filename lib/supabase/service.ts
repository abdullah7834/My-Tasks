import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

export async function ensureStorageBucket(bucketName: string) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const { error } = await serviceClient.storage.createBucket(bucketName, {
    public: true,
  });

  if (error && !/already exists/i.test(error.message || "")) {
    console.error("Failed to ensure storage bucket:", error.message);
  }
}
