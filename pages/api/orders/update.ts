// pages/api/orders/update.ts

import { updateOrderStatus } from "@/admin/utils/helpers";
import type { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { orderId, status, amount } = req.body || {};
    if (!orderId) throw new Error("orderId is required");
    if (!status) throw new Error("status is required");

    await updateOrderStatus(orderId, status, typeof amount === "number" ? amount : undefined);
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}
