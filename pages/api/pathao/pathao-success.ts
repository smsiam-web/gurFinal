// pages/api/courier/pathao-success.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getPathaoToken } from "@/lib/pathao";

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

    // Existing Pathao helper থেকে token নেওয়া হচ্ছে
    const token = await getPathaoToken();

    const response = await fetch(
      "https://merchant.pathao.com/api/v1/user/success",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Pathao success API error:", data);

      return res.status(response.status).json({
        success: false,
        message:
          data?.message || "Failed to fetch Pathao customer success",
        error: data,
      });
    }

    const totalDelivery = Number(
      data?.data?.customer?.total_delivery || 0
    );

    const successfulDelivery = Number(
      data?.data?.customer?.successful_delivery || 0
    );

    const failedDelivery = Math.max(
      0,
      totalDelivery - successfulDelivery
    );

    const successRate =
      totalDelivery > 0
        ? Math.round((successfulDelivery / totalDelivery) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      phone,

      pathao: {
        totalDelivery,
        successfulDelivery,
        failedDelivery,
        successRate,
        rating: data?.data?.customer_rating || null,
      },

      raw: data,
    });
  } catch (error: any) {
    console.error("Pathao customer success error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to fetch Pathao customer success",
    });
  }
}