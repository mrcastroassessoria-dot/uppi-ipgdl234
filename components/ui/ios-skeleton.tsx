'use client'

/** iOS-style skeleton loading components */

function Bone({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-neutral-200/80 dark:bg-neutral-700/60 rounded-lg ios-skeleton-pulse ${className}`} />
  )
}

/** Skeleton for the Home page bottom sheet */
export function HomeSkeleton() {
  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Fake map area */}
      <div className="flex-1 relative bg-neutral-100 dark:bg-neutral-900">
        <div className="absolute top-0 left-0 right-0 px-4 pt-safe-offset-4 pb-2 z-10">
          <Bone className="h-[52px] rounded-[18px]" />
        </div>
        <div className="absolute inset-0 ios-skeleton-pulse bg-neutral-200/40 dark:bg-neutral-800/40" />
      </div>
      {/* Bottom card skeleton */}
      <div className="relative z-20 bg-background rounded-t-[24px] -mt-3 px-5 pt-4 pb-28">
        <div className="flex justify-center mb-3">
          <Bone className="w-9 h-[5px] rounded-full" />
        </div>
        <Bone className="w-20 h-4 mb-1" />
        <Bone className="w-32 h-7 mb-5" />
        {/* Quick services */}
        <div className="flex gap-2.5 mb-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Bone className="w-[76px] h-[76px] rounded-[20px]" />
              <Bone className="w-12 h-3" />
            </div>
          ))}
        </div>
        {/* Suggestions */}
        <Bone className="w-36 h-3 mb-3" />
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-3.5 border-b border-neutral-100/50 dark:border-neutral-800/50 last:border-0">
              <Bone className="w-[38px] h-[38px] rounded-full" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Bone className="w-3/4 h-4" />
                <Bone className="w-1/2 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Skeleton for History page */
export function HistorySkeleton() {
  return (
    <div className="h-dvh bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-safe-offset-4 pb-3 bg-card">
        <Bone className="w-24 h-6 mb-2" />
        <Bone className="w-48 h-4" />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 px-5 py-3">
        <Bone className="w-24 h-8 rounded-full" />
        <Bone className="w-24 h-8 rounded-full" />
        <Bone className="w-24 h-8 rounded-full" />
      </div>
      {/* Ride cards */}
      <div className="px-5 flex flex-col gap-3 pt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-2xl p-4 shadow-sm" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-3 mb-3">
              <Bone className="w-10 h-10 rounded-xl" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Bone className="w-3/5 h-4" />
                <Bone className="w-2/5 h-3" />
              </div>
              <Bone className="w-16 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <Bone className="w-2.5 h-2.5 rounded-full" />
              <Bone className="w-full h-3" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Bone className="w-2.5 h-2.5 rounded-full" />
              <Bone className="w-4/5 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for Wallet page */
export function WalletSkeleton() {
  return (
    <div className="h-dvh bg-background flex flex-col">
      <div className="px-5 pt-safe-offset-4 pb-3 bg-card">
        <Bone className="w-16 h-6 mb-2" />
      </div>
      {/* Balance card */}
      <div className="px-5 py-4">
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <Bone className="w-20 h-3 mb-2" />
          <Bone className="w-32 h-8 mb-4" />
          <div className="flex gap-3">
            <Bone className="flex-1 h-11 rounded-[14px]" />
            <Bone className="flex-1 h-11 rounded-[14px]" />
          </div>
        </div>
      </div>
      {/* Transactions */}
      <div className="px-5">
        <Bone className="w-28 h-3 mb-3" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-neutral-100/50 dark:border-neutral-800/50">
            <Bone className="w-10 h-10 rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Bone className="w-3/5 h-4" />
              <Bone className="w-2/5 h-3" />
            </div>
            <Bone className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for Profile page */
export function ProfileSkeleton() {
  return (
    <div className="h-dvh bg-background flex flex-col">
      <div className="px-5 pt-safe-offset-4 pb-6 bg-card flex flex-col items-center">
        <Bone className="w-20 h-20 rounded-full mb-3" />
        <Bone className="w-36 h-5 mb-1.5" />
        <Bone className="w-24 h-4" />
      </div>
      {/* Stats */}
      <div className="flex gap-4 px-5 py-4 justify-center">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Bone className="w-12 h-6" />
            <Bone className="w-16 h-3" />
          </div>
        ))}
      </div>
      {/* Menu items */}
      <div className="px-5">
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-3 border-b border-neutral-100/50 dark:border-neutral-800/50 last:border-0">
              <Bone className="w-9 h-9 rounded-xl" />
              <Bone className="flex-1 h-4" />
              <Bone className="w-4 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Skeleton for Driver dashboard */
export function DriverSkeleton() {
  return (
    <div className="h-dvh bg-background flex flex-col">
      <div className="px-5 pt-safe-offset-4 pb-3 bg-card">
        <div className="flex items-center gap-3">
          <Bone className="w-12 h-12 rounded-full" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Bone className="w-32 h-5" />
            <Bone className="w-20 h-3" />
          </div>
          <Bone className="w-16 h-8 rounded-full" />
        </div>
      </div>
      {/* Stats row */}
      <div className="flex gap-3 px-5 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 bg-card rounded-2xl p-3.5 shadow-sm flex flex-col gap-2">
            <Bone className="w-8 h-8 rounded-xl" />
            <Bone className="w-full h-5" />
            <Bone className="w-2/3 h-3" />
          </div>
        ))}
      </div>
      {/* Ride requests */}
      <div className="px-5">
        <Bone className="w-32 h-3 mb-3" />
        {[1, 2].map(i => (
          <div key={i} className="bg-card rounded-2xl p-4 mb-3 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Bone className="w-11 h-11 rounded-full" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Bone className="w-2/3 h-4" />
                <Bone className="w-1/3 h-3" />
              </div>
              <Bone className="w-20 h-7" />
            </div>
            <Bone className="w-full h-3 mb-2" />
            <Bone className="w-4/5 h-3" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Generic page skeleton with header */
export function PageSkeleton({ title }: { title?: string }) {
  return (
    <div className="h-dvh bg-background flex flex-col">
      <div className="px-5 pt-safe-offset-4 pb-3 bg-card flex items-center gap-3">
        <Bone className="w-9 h-9 rounded-full" />
        <Bone className="w-28 h-6" />
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <Bone className="w-2/3 h-4" />
            <Bone className="w-full h-3" />
            <Bone className="w-4/5 h-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
