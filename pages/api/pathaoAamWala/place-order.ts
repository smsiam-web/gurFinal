import type { NextApiRequest, NextApiResponse } from 'next';
import { createAamWalaPathaoOrder } from '../../../lib/pathaoAamWala';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const result = await createAamWalaPathaoOrder(req.body);
    res.status(200).json(result); // ✅ Return real API response
  } catch (err) {
    res.status(500).json({ error: true, message: (err as Error).message });
  }
}

