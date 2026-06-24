import { Hono } from 'hono';
import { getBetaZoneInfo } from '../services/beta.js';

const beta = new Hono();

beta.get('/info', (c) => c.json(getBetaZoneInfo()));

export default beta;
