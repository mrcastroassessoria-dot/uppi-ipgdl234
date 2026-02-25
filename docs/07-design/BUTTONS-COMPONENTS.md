# Componentes de Botões iOS - Uppi

Sistema completo de botões seguindo Apple Human Interface Guidelines.

---

## 1. IOSButton (Principal)

Componente base com todas as variantes iOS.

### Variantes

```tsx
import { IOSButton } from '@/components/ui/ios-button'

// Primary - Azul iOS
<IOSButton variant="primary">Solicitar Corrida</IOSButton>

// Success - Verde iOS
<IOSButton variant="success">Confirmar</IOSButton>

// Destructive - Vermelho iOS
<IOSButton variant="destructive">Cancelar Corrida</IOSButton>

// Warning - Laranja iOS
<IOSButton variant="warning">Atenção</IOSButton>

// Secondary - Preenchimento cinza
<IOSButton variant="secondary">Ver Detalhes</IOSButton>

// Outline - Borda com blur
<IOSButton variant="outline">Voltar</IOSButton>

// Ghost - Transparente
<IOSButton variant="ghost">Pular</IOSButton>

// Link - Texto apenas
<IOSButton variant="link">Saiba mais</IOSButton>
```

### Tamanhos

```tsx
<IOSButton size="xs">Extra Small</IOSButton>
<IOSButton size="sm">Small</IOSButton>
<IOSButton size="default">Default</IOSButton>
<IOSButton size="lg">Large</IOSButton>
<IOSButton size="xl">Extra Large</IOSButton>

// Ícones
<IOSButton size="icon">+</IOSButton>
<IOSButton size="icon-sm">×</IOSButton>
<IOSButton size="icon-lg">☰</IOSButton>
```

### Props Especiais

```tsx
// Full width
<IOSButton fullWidth>Botão Largo</IOSButton>

// Loading state
<IOSButton loading>Carregando...</IOSButton>

// Com ícones
<IOSButton leftIcon={<MapPin />}>Localização</IOSButton>
<IOSButton rightIcon={<ChevronRight />}>Avançar</IOSButton>

// Disabled
<IOSButton disabled>Desabilitado</IOSButton>
```

---

## 2. IOSBackButton

Botão de voltar iOS com chevron.

```tsx
import { IOSBackButton } from '@/components/ui/ios-back-button'

// Básico (volta automaticamente)
<IOSBackButton />

// Com label
<IOSBackButton label="Voltar" />

// Com ação customizada
<IOSBackButton onClick={() => router.push('/home')} />
```

---

## 3. IOSButtonGroup

Agrupa botões no estilo iOS.

```tsx
import { IOSButtonGroup } from '@/components/ui/ios-button-group'

// Horizontal (padrão)
<IOSButtonGroup>
  <IOSButton variant="ghost">Cancelar</IOSButton>
  <IOSButton variant="ghost">OK</IOSButton>
</IOSButtonGroup>

// Vertical
<IOSButtonGroup orientation="vertical">
  <IOSButton variant="ghost">Opção 1</IOSButton>
  <IOSButton variant="ghost">Opção 2</IOSButton>
  <IOSButton variant="ghost">Opção 3</IOSButton>
</IOSButtonGroup>
```

---

## 4. IOSSegmentedControl

Controle segmentado iOS (toggle).

```tsx
import { IOSSegmentedControl } from '@/components/ui/ios-button-group'

const [view, setView] = useState('map')

<IOSSegmentedControl
  options={[
    { value: 'map', label: 'Mapa', icon: <Map /> },
    { value: 'list', label: 'Lista', icon: <List /> },
  ]}
  value={view}
  onChange={setView}
/>
```

---

## 5. IOSFAB

Floating Action Button iOS.

```tsx
import { IOSFAB, IOSMiniFAB } from '@/components/ui/ios-fab'

// FAB padrão
<IOSFAB icon={<Plus />} onClick={handleAdd} />

// Com label
<IOSFAB icon={<Plus />} label="Nova Corrida" />

// Posições
<IOSFAB icon={<Plus />} position="bottom-right" />
<IOSFAB icon={<Plus />} position="bottom-center" />
<IOSFAB icon={<Plus />} position="bottom-left" />
<IOSFAB icon={<Plus />} position="top-right" />

// Tamanhos
<IOSFAB icon={<Plus />} size="default" />
<IOSFAB icon={<Plus />} size="lg" />

// Mini FAB
<IOSMiniFAB icon={<Edit />} />
```

---

## 6. Componentes de Conveniência

Wrappers para variantes comuns:

```tsx
import { 
  IOSButtonPrimary,
  IOSButtonSuccess,
  IOSButtonDestructive,
  IOSButtonOutline 
} from '@/components/ui/ios-button'

<IOSButtonPrimary>Solicitar</IOSButtonPrimary>
<IOSButtonSuccess>Confirmar</IOSButtonSuccess>
<IOSButtonDestructive>Cancelar</IOSButtonDestructive>
<IOSButtonOutline>Voltar</IOSButtonOutline>
```

---

## Especificações iOS

### Alturas Padrão
- **xs**: 36px
- **sm**: 44px (mínimo toque iOS)
- **default**: 52px
- **lg**: 60px
- **xl**: 68px

### Cores Sistema iOS
- **Primary**: #007AFF (azul iOS)
- **Success**: #34C759 (verde iOS)
- **Destructive**: #FF3B30 (vermelho iOS)
- **Warning**: #FF9500 (laranja iOS)

### Cantos Arredondados
- **xs/sm**: 10-12px
- **default**: 14px
- **lg**: 16px
- **xl**: 18px

### Transições
- **Scale**: active:scale-[0.97]
- **Duration**: 200ms
- **Easing**: ease-out

### Sombras
- Botões primários têm sombra colorida (25% opacity)
- Outline tem sombra sutil multicamada
- FAB tem sombra dupla elevada

---

## Exemplos Práticos

### Formulário de Login
```tsx
<form className="space-y-4">
  <Input placeholder="Email" />
  <Input type="password" placeholder="Senha" />
  
  <IOSButton type="submit" fullWidth loading={isLoading}>
    Entrar
  </IOSButton>
  
  <IOSButton variant="outline" fullWidth>
    Criar Conta
  </IOSButton>
  
  <IOSButton variant="link">
    Esqueceu a senha?
  </IOSButton>
</form>
```

### Modal com Ações
```tsx
<div className="space-y-3">
  <p>Tem certeza que deseja cancelar esta corrida?</p>
  
  <IOSButtonGroup orientation="vertical">
    <IOSButton variant="destructive">
      Sim, Cancelar
    </IOSButton>
    <IOSButton variant="ghost">
      Não, Voltar
    </IOSButton>
  </IOSButtonGroup>
</div>
```

### Página de Perfil
```tsx
<div className="space-y-3">
  <IOSButton variant="outline" fullWidth leftIcon={<Edit />}>
    Editar Perfil
  </IOSButton>
  
  <IOSButton variant="outline" fullWidth leftIcon={<Settings />}>
    Configurações
  </IOSButton>
  
  <IOSButton variant="destructive" fullWidth>
    Sair da Conta
  </IOSButton>
</div>

<IOSFAB icon={<Plus />} label="Nova Corrida" />
```

---

## Acessibilidade

Todos os componentes incluem:
- ✅ Focus visible com ring azul iOS
- ✅ Aria-labels apropriados
- ✅ Altura mínima de toque (44px)
- ✅ Estados disabled claros
- ✅ Indicadores de loading acessíveis

---

## Performance

- Componentes otimizados com React.forwardRef
- Variants com class-variance-authority
- Transições CSS apenas (sem JS)
- Tree-shaking friendly
