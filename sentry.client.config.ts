import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Session replay for debugging UI issues
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: "system",
      buttonLabel: "Reportar Bug",
      submitButtonLabel: "Enviar",
      cancelButtonLabel: "Cancelar",
      formTitle: "Reportar um problema",
      nameLabel: "Nome",
      namePlaceholder: "Seu nome",
      emailLabel: "Email",
      emailPlaceholder: "seu@email.com",
      messageLabel: "O que aconteceu?",
      messagePlaceholder: "Descreva o problema...",
      successMessageText: "Obrigado pelo feedback!",
    }),
  ],

  // Environment
  environment: process.env.NODE_ENV,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Ignore common non-actionable errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error promise rejection",
    "AbortError",
    "ChunkLoadError",
    "Loading chunk",
  ],
});
