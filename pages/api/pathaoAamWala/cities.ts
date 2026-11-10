// GET /api/pathao/cities
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAamWalaPathaoToken } from '../../../lib/pathaoAamWala';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getAamWalaPathaoToken();

    const response = await fetch(`${process.env.PATHAO_BASE_URL_AAMWALA}/aladdin/api/v1/city-list`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: true, message: (error as Error).message });
  }
}
