export default function ProfileSkeleton() {
  return (
    <div className="h-dvh overflow-y-auto bg-background pb-24 ios-scroll animate-pulse">
      {/* Header */}
      <header className="bg-card/95 ios-blur border-b border-border sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary" />
            <div className="h-6 w-24 bg-secondary rounded-lg" />
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-card rounded-[20px] p-6 mb-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="w-24 h-24 rounded-full bg-secondary mx-auto mb-4" />
          <div className="h-7 w-40 bg-secondary rounded-lg mx-auto mb-2" />
          <div className="h-4 w-32 bg-secondary rounded mx-auto mb-5" />
          <div className="flex gap-8 justify-center">
            <div className="space-y-2">
              <div className="h-8 w-12 bg-secondary rounded mx-auto" />
              <div className="h-3 w-16 bg-secondary rounded" />
            </div>
            <div className="w-px bg-border" />
            <div className="space-y-2">
              <div className="h-8 w-12 bg-secondary rounded mx-auto" />
              <div className="h-3 w-16 bg-secondary rounded" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5">
          <div className="grid w-full grid-cols-2 bg-secondary rounded-[14px] h-[40px] p-1 mb-4">
            <div className="rounded-[10px] bg-card" />
            <div className="rounded-[10px]" />
          </div>

          {/* Tab Content */}
          <div className="bg-card rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-3 w-24 bg-secondary rounded mb-2" />
                  <div className="h-5 w-40 bg-secondary rounded" />
                  {i < 3 && <div className="h-px bg-border my-4" />}
                </div>
              ))}
              <div className="h-12 bg-secondary rounded-[14px] mt-4" />
            </div>
          </div>
        </div>

        {/* Achievements Banner */}
        <div className="w-full rounded-2xl p-4 mb-5 bg-secondary h-20" />

        {/* Settings */}
        <div className="bg-card rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-5">
          <div className="h-4 w-32 bg-secondary rounded mx-5 mt-4 mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < 3 ? 'border-b border-border' : ''}`}>
              <div className="w-[22px] h-[22px] rounded bg-secondary" />
              <div className="flex-1 h-4 bg-secondary rounded" />
              <div className="w-5 h-5 bg-secondary rounded" />
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="bg-card rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="h-[52px] flex items-center justify-center">
            <div className="h-5 w-24 bg-secondary rounded" />
          </div>
        </div>
      </main>
    </div>
  )
}
