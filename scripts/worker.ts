/**
 * Transcript Processing Worker
 *
 * Run this script as a separate process to handle background transcript processing.
 * Usage: npx tsx scripts/worker.ts
 */

import 'dotenv/config';
import { startWorker, stopWorker } from '../lib/queue/transcript-worker';

console.log(JSON.stringify({
  level: 'info',
  message: 'Starting transcript processing worker',
  nodeEnv: process.env.NODE_ENV,
}));

// Start the worker
const worker = startWorker();

// Graceful shutdown handling
async function shutdown(signal: string) {
  console.log(JSON.stringify({
    level: 'info',
    message: `Received ${signal}, shutting down worker gracefully`,
  }));

  await stopWorker();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Worker shutdown complete',
  }));

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Keep the process running
process.on('uncaughtException', (error) => {
  console.log(JSON.stringify({
    level: 'error',
    message: 'Uncaught exception in worker',
    error: error.message,
    stack: error.stack,
  }));
});

process.on('unhandledRejection', (reason) => {
  console.log(JSON.stringify({
    level: 'error',
    message: 'Unhandled rejection in worker',
    reason: String(reason),
  }));
});
