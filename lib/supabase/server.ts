import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const cookieEntries = typeof (cookieStore as any).getAll === "function"
    ? (cookieStore as any).getAll()
    : [];

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () =>
          cookieEntries.map((cookie: { name: string; value: string }) => ({
            name: cookie.name,
            value: cookie.value ?? "",
          })),
        setAll: async (setCookies) => {
          setCookies.forEach(({ name, value, options }) => {
            if (value) {
              cookieStore.set(name, value, options as any);
            } else {
              cookieStore.delete(name, options as any);
            }
          });
        },
      },
    },
  );
}
