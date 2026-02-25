function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-neutral-200/80 dark:bg-neutral-700/60 rounded-lg ios-skeleton-pulse ${className}`} />
}

export default function NotificationsSkeleton() {
  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-safe pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <Bone className="w-10 h-10 rounded-full" />
          <Bone className="h-9 w-24 rounded-[14px]" />
        </div>
        <Bone className="h-7 w-48 mt-4" />
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-5 py-4 border-b border-border/30">
            <div className="flex gap-3">
              <Bone className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-full" />
                <Bone className="h-3 w-3/4" />
                <Bone className="h-3 w-20 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
