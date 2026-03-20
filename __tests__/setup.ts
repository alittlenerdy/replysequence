/**
 * Vitest global setup file
 *
 * Mocks environment variables and global dependencies
 * so tests never touch real databases, APIs, or services.
 */

// Mock environment variables before any module imports
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-not-real';
process.env.ZOOM_WEBHOOK_SECRET_TOKEN = 'test-zoom-webhook-secret';
process.env.RESEND_API_KEY = 're_test_key_not_real';
process.env.CLERK_SECRET_KEY = 'sk_test_not_real';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32-byte hex key
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_not_real';
process.env.STRIPE_SECRET_KEY = 'sk_test_not_real';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_not_real';
