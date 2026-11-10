// pages/api/fraud-check.ts (বা .js)
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const API_URL = "https://zachaikori.com/api/v1/sandbox/fraud-check";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { mobile } = req.body || {};
    if (!mobile) return res.status(400).json({ message: "mobile is required" });

    // env থেকে secrets নাও (Never expose in client!)
    const apiKey = process.env.ZK_API_KEY!;
    const secretKey = process.env.ZK_SECRET_KEY!;

    // PHP-র request()->getHost() সমতুল্য:
    const customerDomain = "jfaamwala.netlify.app";
    console.log(customerDomain)

    const body = new URLSearchParams({ mobile });

    const { data, status } = await axios.post(API_URL, body, {
      headers: {
        "api-key": apiKey,
        "secret-key": secretKey,
        "x-customer-domain": customerDomain,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
    });

    return res.status(status).json(data);
  } catch (err: any) {
    // error response body থাকলে ক্লায়েন্টে পাঠিয়ে দাও
    const status = err?.response?.status || 500;
    const payload = err?.response?.data || { message: err?.message || "API call failed" };
    return res.status(status).json({ status: "error", ...payload });
  }
}
