import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  sendDefaultPii: true,
  spotlight: true,
  integrations: [
    Sentry.spotlightIntegration(),
    Sentry.captureConsoleIntegration({
      levels: ["log", "info", "warn", "error", "debug"],
    }),
  ],
});
