export default function HistorySkeleton() {
  return (
    <div className="h-dvh overflow-y-auto bg-background pb-28 ios-scroll animate-pulse">
      {/* Header */}
      <header className="bg-card/80 ios-blur border-b border-border/40 sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary" />
              <div className="h-6 w-24 bg-secondary rounded-lg" />
            </div>
            <div className="w-9 h-9 rounded-full bg-secondary" />
          </div>
        </div>
      </header>

      <main className="px-4 pt-3">
        {/* Filter Pills */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 bg-secondary rounded-full" />
          ))}
        </div>

        {/* Section Header */}
        <div className="flex items-center gap-3 px-1 pt-4 pb-2">
          <div className="h-3 w-16 bg-secondary rounded" />
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Ride Cards */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="ios-card overflow-hidden" style={{ borderRadius: 20 }}>
              <div className="px-4 py-[14px]">
                <div className="flex items-center gap-3.5">
                  {/* Route timeline */}
                  <div className="flex flex-col items-center gap-[3px] py-[3px] h-16">
                    <div className="w-[9px] h-[9px] rounded-full bg-secondary" />
                    <div className="flex-1 w-[1.5px] bg-secondary rounded-full" />
                    <div className="w-[9px] h-[9px] rounded-full bg-secondary" />
                  </div>

                  {/* Addresses */}
                  <div className="flex-1 min-w-0 space-y-[10px]">
                    <div className="h-4 w-full bg-secondary rounded" />
                    <div className="h-4 w-3/4 bg-secondary rounded" />
                  </div>

                  {/* Right side */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                    <div className="h-3 w-12 bg-secondary rounded" />
                    <div className="h-4 w-16 bg-secondary rounded" />
                  </div>

                  {/* Chevron */}
                  <div className="w-[14px] h-[14px] bg-secondary rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
