"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { triggerHaptic } from "@/hooks/use-haptic"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    triggerHaptic('selection')
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] bg-background/50 hover:bg-background/80 border border-border/50 ios-press transition-all"
      aria-label="Alternar tema"
    >
      <div className="relative w-10 h-10 flex items-center justify-center">
        <Sun
          className={`absolute w-5 h-5 transition-all duration-300 ${
            theme === "dark" 
              ? "text-[#8E8E93] scale-0 opacity-0 rotate-180" 
              : "text-[#FF9500] scale-100 opacity-100 rotate-0"
          }`}
        />
        <Moon
          className={`absolute w-5 h-5 transition-all duration-300 ${
            theme === "light" 
              ? "text-[#8E8E93] scale-0 opacity-0 -rotate-180" 
              : "text-[#007AFF] scale-100 opacity-100 rotate-0"
          }`}
        />
      </div>
      <span className="text-[15px] font-medium text-foreground">
        {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
      </span>
    </button>
  )
}
