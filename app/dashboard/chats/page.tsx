import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChatPage from "@/components/dashboard/ChatPage";

export const dynamic = "force-dynamic";

export default async function DashboardChatsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <ChatPage />
    </div>
  );
}
