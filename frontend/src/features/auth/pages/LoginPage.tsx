import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '../context/useAuth'
import { loginSchema, type LoginFormValues } from '../schemas/login.schema'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [authError, setAuthError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotInfo, setShowForgotInfo] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  function onSubmit(data: LoginFormValues) {
    const ok = login(data.email, data.password)
    if (ok) {
      navigate(from, { replace: true })
    } else {
      setAuthError(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt="Bajrang Fitness Club"
            className="h-48 w-48 object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-zinc-900">Bajrang Fitness Club</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Login form">
            <div className="space-y-4">
              {/* Auth error */}
              {authError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Invalid email or password.
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Email
                  <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2',
                      errors.email
                        ? 'border-red-300 bg-red-50 focus:ring-red-400'
                        : 'border-zinc-200 bg-white focus:ring-blue-500'
                    )}
                    {...register('email', {
                      onChange: () => setAuthError(false),
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Password
                  <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn(
                      'w-full rounded-lg border py-2 pl-3 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2',
                      errors.password
                        ? 'border-red-300 bg-red-50 focus:ring-red-400'
                        : 'border-zinc-200 bg-white focus:ring-blue-500'
                    )}
                    {...register('password', {
                      onChange: () => setAuthError(false),
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-blue-500"
                    {...register('rememberMe')}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotInfo((v) => !v)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Forgot password info */}
              {showForgotInfo && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Password recovery will be available after backend authentication is connected.
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* Dev credential hint */}
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-amber-700">Dev credentials (mock only)</p>
          <div className="space-y-0.5 text-xs text-amber-600">
            <p>arjun.mehta@fitzone.example / owner123</p>
            <p>sneha.desai@fitzone.example / admin123</p>
            <p>ravi.nair@fitzone.example / recept123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
