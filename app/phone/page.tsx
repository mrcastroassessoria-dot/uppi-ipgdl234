"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RevolutLogo } from "@/components/revolut-logo"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { AppBackground } from "@/components/app-background"

// iso2 = código de 2 letras para flagcdn.com/24x18/{iso2}.png
const countries = [
  { code: "+55",  iso2: "br", name: "Brasil" },
  { code: "+1",   iso2: "us", name: "EUA" },
  { code: "+351", iso2: "pt", name: "Portugal" },
  { code: "+44",  iso2: "gb", name: "Reino Unido" },
  { code: "+34",  iso2: "es", name: "Espanha" },
  { code: "+54",  iso2: "ar", name: "Argentina" },
  { code: "+56",  iso2: "cl", name: "Chile" },
  { code: "+57",  iso2: "co", name: "Colômbia" },
  { code: "+52",  iso2: "mx", name: "México" },
  { code: "+49",  iso2: "de", name: "Alemanha" },
  { code: "+33",  iso2: "fr", name: "França" },
  { code: "+39",  iso2: "it", name: "Itália" },
]

function FlagImg({ iso2, size = 24 }: { iso2: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${size}x${Math.round(size * 0.75)}/${iso2}.png`}
      srcSet={`https://flagcdn.com/${size * 2}x${Math.round(size * 2 * 0.75)}/${iso2}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={iso2.toUpperCase()}
      className="rounded-sm object-cover flex-shrink-0"
    />
  )
}

export default function PhonePage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [showPicker, setShowPicker] = useState(false)

  const phoneOk = phone.length >= 10 && /^\d+$/.test(phone)
  const codeOk = code.every((c) => c.length === 1)

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleSendCode = async () => {
    setLoading(true)
    // Simulação de envio de código
    await new Promise((r) => setTimeout(r, 1000))
    setStep(2)
    setLoading(false)
  }

  const handleVerifyCode = async () => {
    setLoading(true)
    // Simulação de verificação
    await new Promise((r) => setTimeout(r, 1200))
    router.push("/home")
    setLoading(false)
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: "#000" }}>
      <AppBackground />

      {/* Back button */}
      <div className="relative z-10 px-5 pt-12 pb-2">
        <button
          type="button"
          onClick={() => {
            if (step === 2) setStep(1)
            else router.back()
          }}
          className="flex items-center justify-center w-9 h-9 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Logo + title */}
      <div className="relative z-10 px-5 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
            <RevolutLogo className="w-4 h-4 text-black" />
          </div>
          <span className="text-sm font-medium text-white/80">Revolut Business</span>
        </div>
        <h1 className="text-[2rem] font-bold text-white leading-tight text-balance">
          {step === 1 ? "Seu telefone" : "Verificar código"}
        </h1>
        <p className="mt-2 text-[15px] text-white/50 leading-relaxed">
          {step === 1
            ? "Usaremos esse número para enviar um código de verificação."
            : `Enviamos um código para ${phone}`}
        </p>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 px-5 flex flex-col gap-4">
        {step === 1 ? (
          <>
            {/* Phone input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Número de telefone
              </label>
              <div className="flex items-center gap-2">
                {/* Country picker button */}
                <button
                  type="button"
                  onClick={() => setShowPicker((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-[15px] rounded-2xl bg-white/5 border border-white/10 text-white text-[15px] font-medium flex-shrink-0 active:scale-[0.97] transition-transform"
                >
                  <FlagImg iso2={selectedCountry.iso2} size={20} />
                  <span className="text-white/50 text-[13px]">{selectedCountry.code}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                </button>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="11 9 1234-5678"
                  className="flex-1 px-4 py-[15px] rounded-2xl bg-white/5 text-white placeholder:text-white/25 text-[15px] outline-none focus:ring-1 focus:ring-white/30 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Country dropdown */}
              {showPicker && (
                <div
                  className="rounded-2xl overflow-hidden mt-1"
                  style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {countries.map((country) => (
                    <button
                      key={country.code + country.name}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country)
                        setShowPicker(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-[15px] active:bg-white/10 transition-colors"
                      style={{
                        backgroundColor: selectedCountry.name === country.name ? "rgba(255,255,255,0.07)" : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <FlagImg iso2={country.iso2} size={20} />
                      <span className="text-white flex-1">{country.name}</span>
                      <span className="text-white/40 text-[13px]">{country.code}</span>
                    </button>
                  ))}
                </div>
              )}

              {phone && !phoneOk && (
                <p className="text-[12px] text-red-400/80">Digite um número válido (mínimo 10 dígitos)</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* OTP inputs */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Código de verificação
              </label>
              <div className="flex gap-2 justify-center">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && i > 0) {
                        document.getElementById(`code-${i - 1}`)?.focus()
                      }
                    }}
                    className="w-12 h-16 text-center text-white text-xl font-bold rounded-2xl bg-white/5 outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                ))}
              </div>
            </div>

            {/* Resend code */}
            <div className="flex justify-center pt-2">
              <button type="button" className="text-[13px] text-white/40 hover:text-white/70 transition-colors">
                Reenviar código
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 px-5 pb-10 pt-6 flex flex-col gap-3">
        <button
          type="button"
          disabled={step === 1 ? !phoneOk : !codeOk || loading}
          onClick={() => {
            if (step === 1) handleSendCode()
            else handleVerifyCode()
          }}
          className="w-full py-[17px] rounded-full bg-white text-black font-semibold text-[15px] tracking-wide active:scale-[0.98] transition-all duration-100 shadow-md disabled:opacity-40"
        >
          {loading ? "Processando..." : step === 1 ? "Enviar código" : "Continuar"}
        </button>
      </div>
    </div>
  )
}
