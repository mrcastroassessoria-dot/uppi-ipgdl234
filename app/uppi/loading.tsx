import { MorphingSpinner } from '@/components/ui/morphing-spinner'

export default function UppiLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <MorphingSpinner size="lg" />
        <p className="text-sm text-muted-foreground font-medium">Carregando UPPI...</p>
      </div>
    </div>
  )
}
