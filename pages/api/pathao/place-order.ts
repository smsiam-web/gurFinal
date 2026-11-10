import type { NextApiRequest, NextApiResponse } from 'next';
import { createPathaoOrder } from '../../../lib/pathao';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const result = await createPathaoOrder(req.body);
    res.status(200).json(result); // ✅ Return real API response
  } catch (err) {
    res.status(500).json({ error: true, message: (err as Error).message });
  }
}

