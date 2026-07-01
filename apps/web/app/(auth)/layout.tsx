// app/(auth)/layout.tsx
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/25 transition-transform group-hover:scale-105">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">
            Teacher<span className="gradient-text">AI</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-4 pt-20 pb-8">
        {children}
      </div>
    </div>
  )
}
