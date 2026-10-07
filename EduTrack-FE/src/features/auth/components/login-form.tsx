'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginInput } from '../schemas/login.schema';
export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const submit = async (input: LoginInput) => {
    setServerError('');
    const { error } = await createClient().auth.signInWithPassword(input);
    if (error) {
      setServerError('Email hoặc mật khẩu không chính xác.');
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  };
  return (
    <form className="mt-7 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
      <label className="block text-sm font-medium">
        Email
        <Input
          {...register('email')}
          type="email"
          autoComplete="email"
          spellCheck={false}
        />
      </label>
      {errors.email && (
        <p className="text-sm text-red-600">{errors.email.message}</p>
      )}
      <label className="block text-sm font-medium">
        Mật khẩu
        <Input
          {...register('password')}
          type="password"
          autoComplete="current-password"
        />
      </label>
      {errors.password && (
        <p className="text-sm text-red-600">{errors.password.message}</p>
      )}
      {serverError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {serverError}
        </p>
      )}
      <Button loading={isSubmitting} type="submit" className="min-h-12 w-full">
        Đăng nhập
      </Button>
    </form>
  );
}
