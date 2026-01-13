import 'dotenv/config';

// Add error handlers
process.on('unhandledRejection', reason => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

// Start the app
const { validateEnv } = await import('./config/env.js');
validateEnv();
await import('./server.js');
