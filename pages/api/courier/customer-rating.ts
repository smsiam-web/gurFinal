import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {
  getPathaoCustomerRating,
} from "@/lib/pathao";

import {
  getSteadfastCustomerRating,
} from "@/lib/steadfast";

const normalizePhone = (
  phone: string = ""
) => {
  let value =
    String(phone)
      .replace(/\D/g, "")
      .trim();

  if (
    value.startsWith("880") &&
    value.length === 13
  ) {
    value =
      "0" + value.slice(3);
  }

  if (
    value.startsWith("1") &&
    value.length === 10
  ) {
    value =
      "0" + value;
  }

  return value;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        success: false,
        message:
          "Method not allowed",
      });
  }

  try {
    const phone =
      normalizePhone(
        req.body?.phone || ""
      );

    if (
      !phone ||
      phone.length !== 11
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid phone number",
        });
    }

    const results =
      await Promise.allSettled([
        getPathaoCustomerRating(
          phone
        ),

        getSteadfastCustomerRating(
          phone
        ),
      ]);

    const pathaoResult =
      results[0];

    const steadfastResult =
      results[1];

    const pathao =
      pathaoResult.status ===
      "fulfilled"
        ? pathaoResult.value
        : null;

    const steadfast =
      steadfastResult.status ===
      "fulfilled"
        ? steadfastResult.value
        : null;

    const totalSuccess =
      Number(
        pathao?.success || 0
      ) +
      Number(
        steadfast?.success || 0
      );

    const totalOrders =
      Number(
        pathao?.total || 0
      ) +
      Number(
        steadfast?.total || 0
      );

    const overallRate =
      totalOrders > 0
        ? Math.round(
            (totalSuccess /
              totalOrders) *
              100
          )
        : 0;

    return res
      .status(200)
      .json({
        success: true,

        phone,

        pathao:
          pathao || {
            success: 0,
            total: 0,
            rate: 0,
            error:
              pathaoResult.status ===
              "rejected"
                ? String(
                    pathaoResult.reason
                  )
                : null,
          },

        steadfast:
          steadfast || {
            success: 0,
            total: 0,
            rate: 0,
            error:
              steadfastResult.status ===
              "rejected"
                ? String(
                    steadfastResult.reason
                  )
                : null,
          },

        overall: {
          success:
            totalSuccess,

          total:
            totalOrders,

          rate:
            overallRate,
        },
      });
  } catch (
    error: any
  ) {
    return res
      .status(500)
      .json({
        success: false,

        message:
          error?.message ||
          "Customer rating failed",
      });
  }
}

