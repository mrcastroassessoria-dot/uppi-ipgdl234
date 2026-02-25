'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function GoBackButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.history.back()}
      className="w-full"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Voltar
    </Button>
  )
}
