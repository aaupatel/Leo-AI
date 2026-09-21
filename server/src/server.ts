import express from 'express';
import { config } from './config';
import { testConnection, closePool, sanitizeErrorMessage } from './database';
import routes from './routes';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Leo AI Server is running.');
});

app.use('/api', routes);

async function startServer(): Promise<void> {
  try {
    await testConnection();
    console.log('Database connection established.');
  } catch (error) {
    console.error(`Database connection failed: ${sanitizeErrorMessage(error)}`);
  }

  app.listen(config.port, () => {
    console.log(`Leo AI Server is running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

startServer();
