// import LoginForm from '@/components/auth/LoginForm';
import LoginForm from '@/components/login/loginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl text-3xl font-bold mb-4">
            T
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900">Welcome back</h1>
          <p className="text-zinc-600 mt-2">Sign in to manage your tasks</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <LoginForm />

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-zinc-500">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-2xl font-medium transition-colors text-black cursor-pointer cursor-pointer"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-center text-sm text-zinc-600 mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}