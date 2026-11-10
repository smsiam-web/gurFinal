// GET /api/pathao/areas?zone_id=123
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPathaoToken } from '../../../lib/pathao';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { zone_id } = req.query;

  if (!zone_id) return res.status(400).json({ message: 'zone_id is required' });

  try {
    const token = await getPathaoToken();

    const response = await fetch(
      `${process.env.PATHAO_BASE_URL}/aladdin/api/v1/zones/${zone_id}/area-list`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: true, message: (error as Error).message });
  }
}

