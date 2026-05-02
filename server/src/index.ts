import cors from 'cors';
import express from 'express';

import { healthRouter } from './routes/health.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(healthRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
