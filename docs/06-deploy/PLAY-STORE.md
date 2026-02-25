# Uppi - Guia de Publicacao na Play Store

**Ultima Atualizacao:** 24/02/2026
**Versao:** 11.0

## Opcao 1: TWA (Trusted Web Activity) - RECOMENDADO

### Passos:

1. **Instalar Bubblewrap CLI**
   ```bash
   npm install -g @nickvdh/nickvdh-nickvdh-nickvdh-nickvdh-nickvdh-nickvdh/nickvdh bubblewrap
   ```

2. **Inicializar TWA**
   ```bash
   bubblewrap init --manifest=https://seu-dominio.com/manifest.json
   ```

3. **Configurar assetlinks.json**
   - Gerar SHA256 fingerprint do keystore:
     ```bash
     keytool -list -v -keystore keystore.jks -alias key0
     ```
   - Substituir `REPLACE_WITH_YOUR_SHA256_FINGERPRINT` em `public/.well-known/assetlinks.json`

4. **Build APK/AAB**
   ```bash
   bubblewrap build
   ```

5. **Upload na Play Console**
   - Criar app na Google Play Console
   - Upload do AAB em Producao > Releases
   - Preencher metadata (nome, descricao, screenshots, categoria: Viagens e local)

### Metadata sugerido:
- **Nome**: Uppi - Viagens com Preco Justo
- **Descricao curta**: Negocie o preco da sua corrida. Economize em cada viagem.
- **Categoria**: Viagens e local
- **Tags**: corrida, transporte, taxi, moto, economia
- **Icone**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: Minimo 2, recomendado 8 (telefone 16:9)

## Opcao 2: Capacitor (Acesso a APIs Nativas)

Se precisar de push notifications nativas (FCM), camera, etc:

1. **Instalar Capacitor**
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init Uppi app.uppi.rider
   npx cap add android
   ```

2. **Configurar**
   - Editar `capacitor.config.ts` com URL do servidor
   - Adicionar plugins necessarios (push, camera, geolocation)

3. **Build e Deploy**
   ```bash
   npx cap sync
   npx cap open android
   ```
   - Build pelo Android Studio

## Firebase Cloud Messaging (Push Nativo)

Para push notifications reais na Play Store:

1. Criar projeto no Firebase Console
2. Adicionar `google-services.json` ao projeto Android
3. Implementar `FirebaseMessagingService` no Android
4. Enviar tokens de FCM para o backend Supabase
5. Usar Firebase Admin SDK para enviar push do servidor
