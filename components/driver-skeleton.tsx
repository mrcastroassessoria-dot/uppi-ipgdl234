export default function DriverSkeleton() {
  return (
    <div className="h-dvh overflow-y-auto bg-gradient-to-br from-neutral-50 via-emerald-50/20 to-neutral-50 pb-24 ios-scroll animate-pulse">
      {/* Header */}
      <header className="bg-white/80 ios-blur border-b border-neutral-200/40 sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-200" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-neutral-200 rounded-lg" />
                <div className="h-3 w-20 bg-neutral-200 rounded" />
              </div>
            </div>
            <div className="w-14 h-8 rounded-full bg-neutral-200" />
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto">
        {/* Status Banner */}
        <div className="mb-5 rounded-[20px] p-4 bg-neutral-200 h-16" />

        {/* Earnings Dashboard */}
        <div className="w-full rounded-[20px] p-4 mb-5 bg-neutral-200 h-20" />

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[20px] p-4 h-24" />
          ))}
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 bg-neutral-200 rounded" />
          <div className="w-8 h-8 rounded-full bg-neutral-200" />
        </div>

        {/* Rides List */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[24px] p-5 h-32" />
          ))}
        </div>
      </main>
    </div>
  )
}
