import express from 'express';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.get('/', (_req, res) => {
  res.send('Leo AI Server is running.');
});

app.listen(port, () => {
  console.log(`Leo AI Server is running on port ${port}`);
});
