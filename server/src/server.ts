import express from 'express';
import { config } from './config';

const app = express();

app.get('/', (_req, res) => {
  res.send('Leo AI Server is running.');
});

app.listen(config.port, () => {
  console.log(`Leo AI Server is running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
