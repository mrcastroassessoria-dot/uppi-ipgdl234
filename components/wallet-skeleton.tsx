export default function WalletSkeleton() {
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

      <main className="px-5 py-5 max-w-2xl mx-auto space-y-5">
        {/* Balance Card */}
        <div className="bg-secondary rounded-[24px] p-6 h-48" />

        {/* Section Title */}
        <div className="h-4 w-32 bg-secondary rounded-lg" />

        {/* Transactions */}
        <div className="bg-card rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`px-5 py-4 flex items-center justify-between ${i < 4 ? 'border-b border-border' : ''}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-secondary" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-secondary rounded" />
                  <div className="h-3 w-20 bg-secondary rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
