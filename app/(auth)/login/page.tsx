import LoginForm from "@/components/login/loginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid size-10 place-items-center rounded-xl bg-foreground font-semibold text-background">
            T
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
            Sign in to Taskly
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Continue to your workspace.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
