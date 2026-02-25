# Guia de Teste do Sistema Realtime

## Sistema de Tempo Real Configurado ✅

O sistema de tempo real está totalmente configurado e conectado ao Supabase. Aqui está como testar:

## Como Testar

### 1. Preparação
- Você precisa de **2 dispositivos ou abas do navegador**
- Uma aba será o **PASSAGEIRO**
- Outra aba será o **MOTORISTA**

### 2. Criar Contas

#### Conta do Motorista (Você)
1. Abra uma aba e vá para `/auth/driver/welcome`
2. Clique em **"Cadastrar como Motorista"**
3. Preencha nome, email e senha
4. Em user-type, escolha **"Motorista"** ou **"Ambos"**
5. Complete o cadastro do veículo em `/uppi/driver/register`
6. Vá para `/uppi/driver` para ver a tela de motorista
7. **Certifique-se de estar ONLINE** (toggle no canto superior direito)

#### Conta do Passageiro (Seu Amigo)
1. Abra outra aba/dispositivo e vá para `/auth/welcome`
2. Clique em **"Criar conta"** ou **"Entrar"**
3. Preencha nome, email e senha diferentes
4. Em user-type, escolha **"Passageiro"** ou **"Ambos"**
5. Vá para a home `/uppi/home`

### 3. Teste do Fluxo Completo

#### Passo 1: Passageiro Solicita Corrida
1. Na aba do passageiro, clique em **"Para onde?"**
2. Insira origem e destino
3. Escolha o tipo de veículo (moto ou carro - **deve ser o mesmo do motorista**)
4. Faça uma oferta de preço (ex: R$ 15,00)
5. Clique em **"Solicitar Corrida"**

#### Passo 2: Motorista Recebe em Tempo Real 🚀
- **A tela do motorista vai atualizar INSTANTANEAMENTE**
- Uma nova corrida aparecerá na lista de solicitações
- Você verá:
  - Nome do passageiro
  - Origem e destino
  - Preço oferecido
  - Distância
- **Console log**: `[v0] New ride received:` com os dados da corrida

#### Passo 3: Motorista Faz Oferta
1. Na tela do motorista, você pode:
   - **Aceitar direto** no preço do passageiro (botão verde)
   - **Fazer contra-oferta** (expandir e digitar novo preço)

#### Passo 4: Passageiro Recebe Oferta em Tempo Real 💰
- **A tela do passageiro vai atualizar INSTANTANEAMENTE**
- Aparecerá o card do motorista com:
  - Nome e foto
  - Avaliação
  - Veículo (marca, modelo, placa)
  - Preço oferecido
- **Console log**: `[v0] New offer received:`

#### Passo 5: Passageiro Aceita
1. Passageiro clica em **"Aceitar Oferta"**
2. **Ambas as telas são redirecionadas INSTANTANEAMENTE** para a tela de rastreamento

## O Que Você Vai Ver no Console

### Console do Motorista (aba do driver):
```
[v0] Driver subscribing to realtime rides, vehicle type: moto
[v0] Realtime subscription status: SUBSCRIBED
[v0] New ride received: { id: "...", passenger_id: "...", ... }
[v0] 🚀 Nova corrida disponível!
```

### Console do Passageiro (aba do passageiro):
```
[v0] Passenger subscribing to offers for ride: abc123
[v0] Realtime subscription status: SUBSCRIBED
[v0] New offer received: { id: "...", driver_id: "...", ... }
[v0] 💰 Nova oferta de motorista!
[v0] Ride status updated: { status: "accepted", ... }
[v0] ✅ Corrida aceita! Redirecionando...
```

## Tecnologias Usadas

- **Supabase Realtime**: Sistema de pub/sub baseado em PostgreSQL
- **PostgreSQL LISTEN/NOTIFY**: Notificações em tempo real do banco
- **WebSockets**: Conexão bidirecional para atualizações instantâneas

## Troubleshooting

### ❌ "Não estou recebendo as corridas em tempo real"
- Verifique se o motorista está **ONLINE** (toggle verde)
- Verifique se os **tipos de veículo são compatíveis** (moto só vê moto, carro só vê carro)
- Abra o console do navegador e procure por logs `[v0]`
- Verifique se o status da subscription é `SUBSCRIBED`

### ❌ "Console.log não aparece"
- Abra o DevTools (F12)
- Vá para a aba **Console**
- Certifique-se de que não há filtros ativos

### ❌ "Ofertas não aparecem"
- Verifique se o passageiro está na tela correta (`/uppi/ride/searching` ou `/uppi/ride/[id]/offers`)
- Verifique os logs no console
- Certifique-se de que o motorista fez uma oferta

## Arquivos Modificados

- ✅ `/app/uppi/driver/page.tsx` - Motorista recebe corridas em tempo real
- ✅ `/app/uppi/ride/searching/page.tsx` - Passageiro recebe ofertas em tempo real
- ✅ `/app/uppi/ride/[id]/offers/page.tsx` - Lista de ofertas atualiza em tempo real

## Próximos Passos

Para melhorar ainda mais o sistema realtime:

1. **Notificações Push** - Usar Firebase Cloud Messaging
2. **Som de Notificação** - Adicionar arquivo `/public/notification.mp3`
3. **Vibração** - Adicionar `navigator.vibrate([200, 100, 200])` quando chegar nova corrida
4. **Toast Notifications** - Usar biblioteca como Sonner para notificações visuais
5. **Badge de Notificação** - Mostrar contador de novas ofertas
