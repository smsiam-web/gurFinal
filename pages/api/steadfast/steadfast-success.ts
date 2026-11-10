import type { NextApiRequest, NextApiResponse } from "next";

const normalizePhone = (phone: string = "") => {
  let value = String(phone).replace(/\D/g, "");

  if (value.startsWith("880") && value.length === 13) {
    value = "0" + value.slice(3);
  }

  if (value.startsWith("1") && value.length === 10) {
    value = "0" + value;
  }

  return value;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const phone = normalizePhone(req.body?.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const sessionCookie =
      process.env.STEADFAST_SESSION_COOKIE;

    if (!sessionCookie) {
      return res.status(500).json({
        success: false,
        message: "STEADFAST_SESSION_COOKIE missing",
      });
    }

    const response = await fetch(
      `https://steadfast.com.bd/user/frauds/check/${phone}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",

          "X-Requested-With": "XMLHttpRequest",

          Cookie: sessionCookie,

          Referer:
            `https://steadfast.com.bd/user/frauds/check?phone=${phone}`,

          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        },

        redirect: "follow",
      }
    );

    const contentType =
      response.headers.get("content-type") || "";

    const text = await response.text();

    // ============================================
    // SESSION EXPIRED / LOGIN PAGE DETECTION
    // ============================================

    if (
      contentType.includes("text/html") ||
      text.includes("Merchant sign-in") ||
      text.includes('action="https://steadfast.com.bd/login"')
    ) {
      return res.status(401).json({
        success: false,
        sessionExpired: true,
        message:
          "Steadfast session expired. Please update STEADFAST_SESSION_COOKIE.",
      });
    }

    // ============================================
    // PARSE JSON
    // ============================================

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        message:
          "Invalid response received from Steadfast",
      });
    }

    // ============================================
    // STEADFAST ERROR
    // ============================================

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data?.message ||
          "Steadfast fraud check failed",
        error: data,
      });
    }

    // ============================================
    // CLEAN RESPONSE
    // ============================================

    const deliveryRatio =
      Number(data?.delivery_ratio || 0);

    const cancellationRatio =
      Number(data?.cancellation_ratio || 0);

    const fraudReports =
      Number(data?.fraud_reports || 0);

    return res.status(200).json({
      success: true,

      phone,

      steadfast: {
        deliveryRatio,

        cancellationRatio,

        deliveredCount:
          data?.delivered_count ?? null,

        cancelledCount:
          data?.cancelled_count ?? null,

        volumeBand:
          data?.volume_band ?? null,

        volumeRange:
          data?.volume_range ?? null,

        fraudReports,

        fraudCategories:
          data?.fraud_categories || [],

        fraudKeywords:
          data?.fraud_keywords || [],

        reportedByYou:
          Boolean(data?.reported_by_you),
      },
    });
  } catch (error: any) {
    console.error(
      "STEADFAST FRAUD CHECK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to check Steadfast customer",
    });
  }
}