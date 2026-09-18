import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_PORT = 3001;
const DEFAULT_NODE_ENV = 'development';
const MIN_PORT = 1;
const MAX_PORT = 65535;

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === '') {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (Number.isNaN(port) || !Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(
      `Configuration error: PORT must be a valid integer between ${MIN_PORT} and ${MAX_PORT}. Received: "${raw}".`,
    );
  }
  return port;
}

const config = {
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV ?? DEFAULT_NODE_ENV,
};

export { config };
