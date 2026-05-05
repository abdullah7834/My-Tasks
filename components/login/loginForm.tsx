'use client';

import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';   // ← Make sure path is correct
import { toast } from 'sonner';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // Show message when redirected from signup
  useEffect(() => {
    if (searchParams.get('message') === 'signup-success') {
      console.log('✅ Account created successfully! Please login.');
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      // Successful login → Redirect to Dashboard
      toast.success('Logged in successfully!');
      router.push('/dashboard');
      router.refresh(); // Important to update session
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
        toast.error('Failed to log in. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-zinc-700">Email Address</label>
        <input
          {...register('email', { required: 'Email is required' })}
          type="email"
          className="mt-1 w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="you@example.com"
          disabled={isLoading}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <div className="flex justify-between">
          <label className="text-sm font-medium text-zinc-700">Password</label>
          <a href="#" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <input
          {...register('password', { required: 'Password is required' })}
          type="password"
          className="mt-1 w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-2xl transition-all active:scale-[0.985] cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}