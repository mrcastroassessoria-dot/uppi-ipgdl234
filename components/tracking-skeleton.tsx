function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-neutral-200/80 dark:bg-neutral-700/60 rounded-lg ios-skeleton-pulse ${className}`} />
}

export default function TrackingSkeleton() {
  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Map placeholder */}
      <div className="flex-1 relative bg-secondary/20">
        <Bone className="w-full h-full" />
        {/* Back button */}
        <div className="absolute top-safe left-5">
          <Bone className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Bottom card */}
      <div className="flex-shrink-0 bg-card rounded-t-[28px] p-5 space-y-4 shadow-lg">
        {/* Driver info */}
        <div className="flex items-center gap-4">
          <Bone className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Bone className="h-5 w-32" />
            <Bone className="h-4 w-24" />
          </div>
          <Bone className="w-10 h-10 rounded-full" />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-3 w-3/4" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Bone className="flex-1 h-12 rounded-[16px]" />
          <Bone className="flex-1 h-12 rounded-[16px]" />
        </div>
      </div>
    </div>
  )
}
