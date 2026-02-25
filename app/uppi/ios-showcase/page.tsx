'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Phone, MessageCircle, MapPin } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function IosShowcasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [switchValue, setSwitchValue] = useState(true)
  const [sliderValue, setSliderValue] = useState([50])

  return (
    <div className="h-dvh flex flex-col bg-[#F2F2F7] dark:bg-black">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary -ml-2"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-[17px] font-normal">Voltar</span>
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">Componentes iOS</h1>
          <div className="w-[70px]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
          
          {/* Switches */}
          <section>
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Switches e Controles
            </h3>
            <Card className="overflow-hidden rounded-[14px] border-0 shadow-sm">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[17px] font-medium">iOS Switch</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Com haptic feedback</p>
                  </div>
                  <Switch
                    checked={switchValue}
                    onCheckedChange={setSwitchValue}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* Badges */}
          <section>
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Badges e Status
            </h3>
            <Card className="overflow-hidden rounded-[14px] border-0 shadow-sm">
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Padrao</Badge>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">Sucesso</Badge>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">Atencao</Badge>
                  <Badge variant="destructive">Erro</Badge>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Info</Badge>
                </div>
              </div>
            </Card>
          </section>

          {/* Slider */}
          <section>
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Sliders
            </h3>
            <Card className="overflow-hidden rounded-[14px] border-0 shadow-sm">
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[15px] font-medium mb-3">
                    Volume: {sliderValue[0]}%
                  </p>
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* Input */}
          <section>
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Inputs
            </h3>
            <Card className="overflow-hidden rounded-[14px] border-0 shadow-sm">
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[15px]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="h-[48px] rounded-[12px] text-[17px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[15px]">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-[48px] rounded-[12px] text-[17px]"
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* Buttons */}
          <section>
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Toasts e Alertas
            </h3>
            <Card className="overflow-hidden rounded-[14px] border-0 shadow-sm">
              <div className="p-5 space-y-3">
                <Button
                  onClick={() => {
                    toast({
                      title: "Sucesso",
                      description: "Acao executada com sucesso",
                    })
                  }}
                  className="w-full h-[48px] rounded-[14px] bg-green-500 hover:bg-green-600 text-white font-semibold text-[17px]"
                >
                  Toast de Sucesso
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Erro",
                      description: "Algo deu errado",
                      variant: "destructive",
                    })
                  }}
                  variant="destructive"
                  className="w-full h-[48px] rounded-[14px] font-semibold text-[17px]"
                >
                  Toast de Erro
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Atencao",
                      description: "Revise suas informacoes",
                    })
                  }}
                  className="w-full h-[48px] rounded-[14px] bg-orange-500 hover:bg-orange-600 text-white font-semibold text-[17px]"
                >
                  Toast de Atencao
                </Button>
              </div>
            </Card>
          </section>

          {/* Cards */}
          <section>
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Cards iOS
            </h3>
            <Card className="overflow-hidden rounded-[14px] border-0 shadow-sm">
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[17px] font-semibold">Card de Exemplo</h4>
                    <p className="text-[15px] text-muted-foreground">Descricao do card</p>
                  </div>
                  <Badge>3</Badge>
                </div>
              </div>
            </Card>
          </section>

        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-6 z-50">
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => {
            toast({
              title: "FAB Clicado",
              description: "Voce clicou no botao flutuante",
            })
          }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
