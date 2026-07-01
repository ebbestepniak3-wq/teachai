// app/loading.tsx – Phase 12: Premium loading
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
