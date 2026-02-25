import { MorphingSpinner } from '@/components/ui/morphing-spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <MorphingSpinner size={48} />
        <p className="text-sm text-white">Carregando...</p>
      </div>
    </div>
  )
}
