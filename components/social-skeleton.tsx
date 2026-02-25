function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-neutral-200/80 dark:bg-neutral-700/60 rounded-lg ios-skeleton-pulse ${className}`} />
}

export default function SocialSkeleton() {
  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-safe pb-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <Bone className="w-10 h-10 rounded-full" />
          <Bone className="h-9 w-32 rounded-[14px]" />
        </div>
        <Bone className="h-5 w-40" />
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto ios-scroll px-5 py-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ios-card p-4 space-y-3">
            {/* User info */}
            <div className="flex items-center gap-3">
              <Bone className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
            {/* Content */}
            <div className="space-y-2">
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-4/5" />
            </div>
            {/* Actions */}
            <div className="flex items-center gap-6 pt-2">
              <Bone className="h-8 w-16 rounded-full" />
              <Bone className="h-8 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
