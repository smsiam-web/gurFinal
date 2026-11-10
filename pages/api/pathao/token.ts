// pages/api/pathao/token.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPathaoToken } from '../../../lib/pathao';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Only GET allowed' });

  try {
    const token = await getPathaoToken();
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
