import app from './app';
import { config } from './config/env';
import { initializeDatabase } from './config/initDb';

async function bootstrap(): Promise<void> {
  await initializeDatabase();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(`Failed to start server: ${message}`);
  process.exit(1);
});
