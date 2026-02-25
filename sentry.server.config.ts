import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub OAuth tokens and sensitive data
    if (event.extra) {
      for (const key of Object.keys(event.extra)) {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
          event.extra[key] = '[REDACTED]';
        }
      }
    }
    return event;
  },
});
