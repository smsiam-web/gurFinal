// pages/api/steadfast/create-order.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sfCreateOrder, SteadfastCreateOrderReq } from "@/lib/steadfast";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body as Partial<SteadfastCreateOrderReq>;

    // very light validation
    if (
      body.cod_amount == null ||
      !body.invoice ||
      !body.recipient_name ||
      !body.recipient_phone ||
      !body.recipient_address
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // phone normalization (11 digits)
    const phone = String(body.recipient_phone).replace(/\D/g, "");
    if (!/^01\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone. Use 01XXXXXXXXX" });
    }

    const payload: SteadfastCreateOrderReq = {
      cod_amount: String(body.cod_amount),
      invoice: String(body.invoice),
      note: body.note ?? "",
      recipient_name: String(body.recipient_name),
      recipient_phone: phone,
      recipient_address: String(body.recipient_address),
    };

    const data = await sfCreateOrder(payload);
    return res.status(200).json({ type: "success", code: 200, data });
  } catch (err: any) {
    console.error("steadfast/create-order failed:", err);
    return res.status(500).json({ type: "error", message: err?.message || "Server error" });
  }
}
