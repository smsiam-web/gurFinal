import type { NextApiRequest, NextApiResponse } from "next";

const BASE = process.env.ALPHA_SMS_BASE || "https://api.sms.net.bd";
const API_KEY = process.env.ALPHA_SMS_API_KEY || "";
const SENDER  = process.env.ALPHA_SMS_SENDER_ID || "";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { to, msg } = req.body || {};
    const phone = String(to || "").replace(/\D/g, "");

    if (!API_KEY) return res.status(500).json({ message: "SMS API key missing" });
    if (!/^01\d{9}$/.test(phone)) return res.status(400).json({ message: "Invalid phone (01XXXXXXXXX)" });
    if (!msg || String(msg).trim().length < 3) return res.status(400).json({ message: "Empty message" });

    // Alpha SMS accepts form payload: api_key, to, msg, (optional sender_id)
    const form = new URLSearchParams();
    form.append("api_key", API_KEY);
    form.append("to", phone);
    form.append("msg", String(msg));
    if (SENDER) form.append("sender_id", SENDER);

    const resp = await fetch(`${BASE}/sendsms`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return res.status(resp.status).json({ message: data?.msg || "SMS gateway error", gateway: data });
    }

    return res.status(200).json({ ok: true, gateway: data });
  } catch (e: any) {
    console.error("Alpha SMS failed:", e);
    return res.status(500).json({ message: e?.message || "Server error" });
  }
}
