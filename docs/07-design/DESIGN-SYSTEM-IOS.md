# Sistema de Design iOS - Uppi

**Data:** 24/02/2026  
**Versao:** 11.0  
**Objetivo:** Garantir consistência visual com design iOS profissional em todo o app

---

## 🎨 Princípios do Design iOS

### 1. Clareza
- Conteúdo é prioridade
- Texto legível em todos os tamanhos
- Ícones precisos e lucidez
- Funcionalidades aparentes

### 2. Deferência
- Interface não compete com conteúdo
- Uso sutil de blur e transparência
- Cores não intrusivas
- Transições fluidas

### 3. Profundidade
- Hierarquia visual clara
- Camadas e sobreposições realistas
- Movimento e animação com propósito

---

## 📐 Layout

### Safe Areas
```css
/* Sempre considere safe areas em iOS */
padding-top: calc(env(safe-area-inset-top) + 0.75rem)
padding-bottom: calc(env(safe-area-inset-bottom) + 1rem)
padding-left: env(safe-area-inset-left)
padding-right: env(safe-area-inset-right)
```

### Espaçamento
- **Pequeno:** 8px (2)
- **Médio:** 16px (4)
- **Grande:** 24px (6)
- **Extra Grande:** 32px (8)

### Grid
- Margens laterais: 16px (px-4)
- Gap entre elementos: 12-16px

---

## 🎨 Cores

### Sistema iOS
```css
--ios-blue: #007AFF;
--ios-green: #34C759;
--ios-orange: #FF9500;
--ios-red: #FF3B30;
--ios-yellow: #FFCC00;
--ios-purple: #AF52DE;
```

### Fundos
```css
--background: Branco/Preto
--card: rgba(255,255,255,0.9) / rgba(28,28,30,0.9)
--muted: rgba(120,120,128,0.1) / rgba(142,142,147,0.2)
```

### Texto
```css
--foreground: rgba(0,0,0,0.85) / rgba(255,255,255,0.85)
--muted-foreground: rgba(60,60,67,0.6) / rgba(235,235,245,0.6)
```

---

## 📝 Tipografia

### Hierarquia
```tsx
// Large Title (34px, bold, -0.8px letter-spacing)
<h1 className="text-[34px] font-bold tracking-[-0.8px] leading-[1.15]">

// Title 1 (28px, bold)
<h2 className="text-[28px] font-bold tracking-[-0.4px]">

// Title 2 (22px, bold)
<h3 className="text-[22px] font-bold tracking-[-0.2px]">

// Title 3 (20px, semibold)
<h4 className="text-[20px] font-semibold">

// Headline (17px, semibold)
<p className="text-[17px] font-semibold">

// Body (17px, regular)
<p className="text-[17px]">

// Callout (16px)
<p className="text-base">

// Subhead (15px)
<p className="text-[15px]">

// Footnote (13px)
<p className="text-[13px]">

// Caption (12px)
<p className="text-xs">
```

### Pesos
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

---

## 🔘 Componentes

### Botão Primário
```tsx
<button className="
  w-full h-[52px] 
  bg-[#007AFF] hover:bg-[#0066CC] 
  text-white text-[17px] font-semibold 
  rounded-[14px] 
  active:scale-[0.97] 
  transition-all duration-150 
  shadow-[0_1px_3px_rgba(0,0,0,0.1)]
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Continuar
</button>
```

### Botão Secundário
```tsx
<button className="
  w-full h-[52px] 
  bg-muted/50 hover:bg-muted 
  text-foreground text-[17px] font-semibold 
  rounded-[14px] 
  active:scale-[0.97] 
  transition-all duration-150
">
  Cancelar
</button>
```

### Botão Icon (Circular)
```tsx
<button className="
  w-9 h-9 
  flex items-center justify-center 
  rounded-full 
  active:scale-95 active:bg-muted/50 
  transition-all
">
  <ChevronLeft className="w-6 h-6 text-[#007AFF]" />
</button>
```

### Botão de Voltar
```tsx
<button className="
  w-9 h-9 
  flex items-center justify-center 
  rounded-full 
  ios-press
">
  <svg className="w-6 h-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
</button>
```

---

## 🃏 Cards

### Card Padrão
```tsx
<div className="
  bg-card/90 ios-blur 
  rounded-[20px] 
  p-5 
  shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] 
  dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.04),0_2px_12px_rgba(0,0,0,0.3)] 
  border-[0.5px] border-border/50
">
  {/* Content */}
</div>
```

### Card Elevado
```tsx
<div className="
  bg-card 
  rounded-[20px] 
  p-5 
  shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.08)] 
  dark:shadow-[0_2px_12px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.4)]
">
  {/* Content */}
</div>
```

### Card com Pressão (Interativo)
```tsx
<button className="
  w-full 
  bg-card/90 ios-blur 
  rounded-[20px] 
  p-5 
  text-left 
  active:scale-[0.97] 
  transition-all duration-150
">
  {/* Content */}
</button>
```

---

## 📥 Inputs

### Input Padrão
```tsx
<input className="
  w-full h-[44px] 
  px-4 
  bg-muted/50 
  border-none 
  rounded-[10px] 
  text-[17px] text-foreground 
  placeholder:text-muted-foreground 
  focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20
" />
```

### Input com Label
```tsx
<div className="space-y-2">
  <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
    Nome
  </label>
  <input className="..." />
</div>
```

---

## 📋 Listas

### List Item com Chevron
```tsx
<button className="
  w-full 
  flex items-center justify-between 
  px-4 py-4 
  bg-card 
  border-b border-border/30 
  active:bg-muted/30 
  transition-colors
">
  <div className="flex items-center gap-3">
    <div className="w-7 h-7 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
      <Icon className="w-4 h-4 text-[#007AFF]" />
    </div>
    <span className="text-[17px] text-foreground">Item</span>
  </div>
  <ChevronRight className="w-5 h-5 text-muted-foreground" />
</button>
```

### List Section
```tsx
<div className="space-y-1">
  <h3 className="px-4 py-2 text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
    Seção
  </h3>
  <div className="bg-card rounded-[10px] overflow-hidden">
    {/* List items */}
  </div>
</div>
```

---

## 🎭 Efeitos

### Blur (Glass Effect)
```css
.ios-blur {
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
}

.ios-blur-heavy {
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
}
```

### Press Effect
```css
.ios-press {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ios-press:active {
  transform: scale(0.95);
  background-color: rgba(120, 120, 128, 0.1);
}
```

### Scroll Behavior
```css
.ios-scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

---

## 🎬 Animações

### Fade Up (Entrada de página)
```css
@keyframes ios-fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-ios-fade-up {
  animation: ios-fade-up 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Fade In (Aparição suave)
```css
@keyframes ios-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-ios-fade-in {
  animation: ios-fade-in 300ms ease-out;
}
```

### Scale (Pressão)
```css
.active\:scale-\[0\.97\]:active {
  transform: scale(0.97);
}
```

---

## 🎨 Ícones

### Tamanhos Padrão
- **Pequeno:** 16px (w-4 h-4)
- **Médio:** 20px (w-5 h-5)
- **Grande:** 24px (w-6 h-6)
- **Extra Grande:** 28px (w-7 h-7)

### Stroke Width
- **Regular:** 2
- **Semibold:** 2.5
- **Bold:** 3

### Cores
- **Primário:** text-[#007AFF]
- **Sucesso:** text-[#34C759]
- **Aviso:** text-[#FF9500]
- **Erro:** text-[#FF3B30]
- **Secundário:** text-muted-foreground

---

## 🎯 Headers

### Navigation Bar (Pequeno)
```tsx
<header className="
  bg-card/80 ios-blur-heavy 
  border-b border-border/40 
  sticky top-0 z-30
">
  <div className="
    px-4 
    pt-[calc(env(safe-area-inset-top)+0.75rem)] 
    pb-3 
    flex items-center gap-3
  ">
    <button className="w-9 h-9 rounded-full ios-press">
      {/* Back icon */}
    </button>
    <h1 className="text-[17px] font-semibold">Título</h1>
  </div>
</header>
```

### Large Title
```tsx
<header className="
  bg-card/80 ios-blur-heavy 
  border-b border-border/40 
  sticky top-0 z-30
">
  <div className="
    px-4 
    pt-[calc(env(safe-area-inset-top)+0.75rem)] 
    pb-3
  ">
    <div className="flex items-center gap-3 mb-2">
      <button className="w-9 h-9 rounded-full ios-press -ml-1">
        {/* Back icon */}
      </button>
    </div>
    <h1 className="text-[34px] font-bold tracking-[-0.8px] leading-[1.15]">
      Título Grande
    </h1>
  </div>
</header>
```

---

## 📱 Bottom Navigation

```tsx
<nav className="
  fixed bottom-0 left-0 right-0 
  bg-card/95 ios-blur-heavy 
  border-t border-border/40 
  safe-area-bottom
  z-50
">
  <div className="flex items-center justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
    {tabs.map(tab => (
      <button key={tab.id} className="
        flex flex-col items-center 
        gap-1 py-1 px-4 
        rounded-[10px] 
        active:bg-muted/30 
        transition-colors
      ">
        <tab.icon className="w-6 h-6" />
        <span className="text-[10px] font-medium">{tab.label}</span>
      </button>
    ))}
  </div>
</nav>
```

---

## 🎨 Badges & Tags

### Badge
```tsx
<span className="
  inline-flex items-center 
  px-2.5 py-1 
  bg-[#007AFF]/10 
  text-[#007AFF] 
  text-[13px] font-semibold 
  rounded-full
">
  Novo
</span>
```

### Status Badge
```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-[#34C759]" />
  <span className="text-[15px] text-muted-foreground">Ativo</span>
</div>
```

---

## ✅ Checklist de Implementação

Para cada página do app, verificar:

- [ ] Header com safe-area e blur
- [ ] Botão de voltar circular com chevron iOS
- [ ] Large title (34px, bold, -0.8px tracking)
- [ ] Cards com rounded-[20px] e blur
- [ ] Botões com altura 52px e rounded-[14px]
- [ ] Active states (scale-[0.97])
- [ ] Inputs com altura 44px e rounded-[10px]
- [ ] Cores do sistema iOS (#007AFF, etc.)
- [ ] Sombras sutis e semi-transparentes
- [ ] Animação fade-up na entrada
- [ ] Safe-area em bottom content
- [ ] Haptic feedback nos toques
- [ ] Scroll suave (ios-scroll)
- [ ] Chevron (>) em list items

---

## 🚀 Componentes Prontos

Use os componentes já criados:
- `IOSCard` - Cards com variantes
- `IOSBackButton` - Botão de voltar padrão
- `IOSChevron` - Chevron para listas
- `IOSBottomSheet` - Modais bottom
- `IOSInputEnhanced` - Input com animações
- `IOSNavigationBar` - Header padrão
- `IOSSearchBar` - Busca estilo iOS

---

## 📚 Referências

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [iOS Design System](https://www.figma.com/@apple)
