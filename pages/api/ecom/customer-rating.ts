// pages/api/courier/customer-rating.ts

import type { NextApiRequest, NextApiResponse } from "next";

// =====================================================
// PHONE NORMALIZER
// সব নম্বর 01XXXXXXXXX format-এ রাখবে
// =====================================================

function normalizePhone(phone: string = "") {
  let value = String(phone)
    .replace(/\D/g, "")
    .trim();

  // 8801712345678 -> 01712345678
  if (value.startsWith("880") && value.length === 13) {
    value = "0" + value.slice(3);
  }

  // 1712345678 -> 01712345678
  if (value.startsWith("1") && value.length === 10) {
    value = "0" + value;
  }

  return value;
}

// =====================================================
// SUCCESS RATE
// =====================================================

function calculateRate(success: number, total: number) {
  if (!total || total <= 0) return 0;

  return Math.round((success / total) * 100);
}

// =====================================================
// SAFE NUMBER
// =====================================================

function safeNumber(value: any) {
  const n = Number(value || 0);

  return Number.isNaN(n) ? 0 : n;
}

// =====================================================
// API HANDLER
// =====================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ===================================================
  // METHOD CHECK
  // ===================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // =================================================
    // PHONE
    // =================================================

    const phone = normalizePhone(
      req.body?.phone || ""
    );

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Bangladesh mobile basic validation
    if (
      phone.length !== 11 ||
      !phone.startsWith("01")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // =================================================
    // ENV VARIABLES
    // =================================================

    const sessionCookie =
      process.env.ECOMDRIVE_SESSION_COOKIE || "";

    const deviceFingerprint =
      process.env.ECOMDRIVE_DEVICE_FINGERPRINT || "";

    const deviceFingerprintV2 =
      process.env.ECOMDRIVE_DEVICE_FINGERPRINT_V2 || "";

    const deviceToken =
      process.env.ECOMDRIVE_DEVICE_TOKEN || "";

    if (!sessionCookie) {
      return res.status(500).json({
        success: false,
        message:
          "ECOMDRIVE_SESSION_COOKIE missing",
      });
    }

    // =================================================
    // TRPC INPUT
    //
    // Expected:
    // {"json":{"phone":"01581723700"}}
    // =================================================

    const input = encodeURIComponent(
      JSON.stringify({
        json: {
          phone,
        },
      })
    );

    const url =
      `https://grow.ecomdrivebd.com/api/trpc/pathao.getCustomerRating?input=${input}`;

    // =================================================
    // REQUEST HEADERS
    // =================================================

    const headers: Record<string, string> = {
      Accept: "application/json",

      Cookie: sessionCookie,

      Referer:
        "https://grow.ecomdrivebd.com/ecom/ecom-new-order",

      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
    };

    if (deviceFingerprint) {
      headers["x-device-fingerprint"] =
        deviceFingerprint;
    }

    if (deviceFingerprintV2) {
      headers["x-device-fingerprint-v2"] =
        deviceFingerprintV2;
    }

    if (deviceToken) {
      headers["x-device-token"] =
        deviceToken;
    }

    // =================================================
    // CALL ECOMDRIVE
    // =================================================

    const response = await fetch(url, {
      method: "GET",

      headers,

      // redirect detect করার জন্য
      redirect: "manual",
    });

    // =================================================
    // RESPONSE INFO
    // =================================================

    const status = response.status;

    const contentType =
      response.headers.get("content-type") || "";

    const location =
      response.headers.get("location") || "";

    const text =
      await response.text();

    console.log(
      "[ECOMDRIVE CUSTOMER RATING]"
    );

    console.log(
      "Phone:",
      phone
    );

    console.log(
      "Status:",
      status
    );

    console.log(
      "Content-Type:",
      contentType
    );

    if (location) {
      console.log(
        "Redirect:",
        location
      );
    }

    // =================================================
    // REDIRECT = AUTH / SESSION PROBLEM
    // =================================================

    if (
      status >= 300 &&
      status < 400
    ) {
      return res.status(401).json({
        success: false,

        sessionExpired: true,

        message:
          "EcomDrive session expired or authentication redirect detected.",

        status,

        redirect:
          location || null,
      });
    }

    // =================================================
    // HTML RESPONSE DETECTION
    // =================================================

    const trimmed =
      text.trim().toLowerCase();

    if (
      contentType.includes("text/html") ||
      trimmed.startsWith("<!doctype") ||
      trimmed.startsWith("<html")
    ) {
      return res.status(401).json({
        success: false,

        sessionExpired: true,

        message:
          "EcomDrive returned HTML instead of JSON. Session may be expired.",
      });
    }

    // =================================================
    // JSON PARSE
    // =================================================

    let raw: any;

    try {
      raw = JSON.parse(text);
    } catch (error) {
      console.error(
        "ECOMDRIVE JSON PARSE ERROR:",
        text.slice(0, 500)
      );

      return res.status(502).json({
        success: false,

        message:
          "Invalid JSON response received from EcomDrive.",
      });
    }

    // =================================================
    // ECOMDRIVE HTTP ERROR
    // =================================================

    if (!response.ok) {
      console.error(
        "ECOMDRIVE API ERROR:",
        raw
      );

      return res.status(status).json({
        success: false,

        message:
          raw?.error?.json?.message ||
          raw?.message ||
          "EcomDrive customer rating request failed",

        error: raw,
      });
    }

    // =================================================
    // TRPC ERROR DETECTION
    // =================================================

    if (raw?.error) {
      console.error(
        "ECOMDRIVE TRPC ERROR:",
        raw.error
      );

      return res.status(400).json({
        success: false,

        message:
          raw?.error?.json?.message ||
          "EcomDrive returned an error",

        error: raw.error,
      });
    }

    // =================================================
    // GET ACTUAL RESPONSE
    //
    // Expected:
    //
    // raw.result.data.json
    // =================================================

    const data =
      raw?.result?.data?.json;

    if (!data) {
      console.error(
        "Unexpected EcomDrive response structure:",
        raw
      );

      return res.status(502).json({
        success: false,

        message:
          "Unexpected EcomDrive response structure",

        raw,
      });
    }

    // =================================================
    // PATHAO
    // =================================================

    const pathaoSuccess =
      safeNumber(
        data.pathaoSuccessOrder
      );

    const pathaoTotal =
      safeNumber(
        data.pathaoTotalOrder
      );

    // =================================================
    // STEADFAST
    // =================================================

    const steadfastSuccess =
      safeNumber(
        data.steadfastSuccessOrder
      );

    const steadfastTotal =
      safeNumber(
        data.steadfastTotalOrder
      );

    // =================================================
    // REDX
    // =================================================

    const redxSuccess =
      safeNumber(
        data.redxSuccessOrder
      );

    const redxTotal =
      safeNumber(
        data.redxTotalOrder
      );

    // =================================================
    // CARRYBEE
    // =================================================

    const carrybeeSuccess =
      safeNumber(
        data.carrybeeSuccessOrder
      );

    const carrybeeTotal =
      safeNumber(
        data.carrybeeTotalOrder
      );

    // =================================================
    // OVERALL
    // =================================================

    const overallSuccess =
      safeNumber(
        data.successOrders
      );

    const overallTotal =
      safeNumber(
        data.totalOrders
      );

    // =================================================
    // CLEAN RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      phone,

      pathao: {
        rated:
          Boolean(
            data.isPathaoRated
          ),

        success:
          pathaoSuccess,

        total:
          pathaoTotal,

        rate:
          calculateRate(
            pathaoSuccess,
            pathaoTotal
          ),
      },

      steadfast: {
        rated:
          Boolean(
            data.isSteadfastRated
          ),

        success:
          steadfastSuccess,

        total:
          steadfastTotal,

        rate:
          calculateRate(
            steadfastSuccess,
            steadfastTotal
          ),

        note:
          data.steadfastNote ??
          null,
      },

      redx: {
        rated:
          Boolean(
            data.isRedxRated
          ),

        success:
          redxSuccess,

        total:
          redxTotal,

        rate:
          calculateRate(
            redxSuccess,
            redxTotal
          ),
      },

      carrybee: {
        rated:
          Boolean(
            data.isCarryBeeRated
          ),

        success:
          carrybeeSuccess,

        total:
          carrybeeTotal,

        rate:
          calculateRate(
            carrybeeSuccess,
            carrybeeTotal
          ),
      },

      overall: {
        success:
          overallSuccess,

        total:
          overallTotal,

        rate:
          calculateRate(
            overallSuccess,
            overallTotal
          ),

        // এটা percentage না,
        // EcomDrive-এর own rating score
        rating:
          safeNumber(
            data.rating
          ),
      },

      meta: {
        pending:
          Boolean(
            data.pending
          ),

        stale:
          Boolean(
            data.stale
          ),

        source:
          data.source ??
          null,

        hasBreakdown:
          Boolean(
            data.hasBreakdown
          ),

        asOf:
          data.asOf ??
          null,
      },
    });
  } catch (error: any) {
    console.error(
      "CUSTOMER RATING API ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Failed to fetch customer rating",
    });
  }
}