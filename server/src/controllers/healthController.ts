import type { Request, Response } from 'express';

import { healthStatus } from '../services/healthService.js';

export function getHealth(_req: Request, res: Response) {
  res.json(healthStatus());
}
