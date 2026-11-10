// lib/customerRating.ts

import {
  getPathaoCustomerRating,
} from "@/lib/pathao";

import {
  getSteadfastCustomerRating,
} from "@/lib/steadfast";

// =====================================================
// SAFE NUMBER
// =====================================================

function safeNumber(value: any) {
  const number = Number(value || 0);

  return Number.isNaN(number)
    ? 0
    : number;
}

// =====================================================
// CALCULATE RATE
// =====================================================

function calculateRate(
  success: number,
  total: number
) {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.round(
    (success / total) * 100
  );
}

// =====================================================
// MAIN CUSTOMER RATING
// =====================================================

export async function getCustomerRating(
  phone: string
) {
  try {
    // ===============================================
    // PATHAO + STEADFAST একই সাথে call
    // ===============================================

    const results =
      await Promise.allSettled([
        getPathaoCustomerRating(phone),

        getSteadfastCustomerRating(phone),
      ]);

    // ===============================================
    // PATHAO RESULT
    // ===============================================

    const pathaoResult =
      results[0];

    let pathao: any;

    if (
      pathaoResult.status ===
      "fulfilled"
    ) {
      pathao = {
        success:
          safeNumber(
            pathaoResult.value
              ?.success
          ),

        total:
          safeNumber(
            pathaoResult.value
              ?.total
          ),

        rate:
          safeNumber(
            pathaoResult.value
              ?.rate
          ),

        rating:
          pathaoResult.value
            ?.rating ||
          null,
      };
    } else {
      pathao = {
        success: 0,

        total: 0,

        rate: 0,

        rating: null,

        error:
          pathaoResult.reason
            ?.message ||
          String(
            pathaoResult.reason ||
              "Pathao failed"
          ),
      };
    }

    // ===============================================
    // STEADFAST RESULT
    // ===============================================

    const steadfastResult =
      results[1];

    let steadfast: any;

    if (
      steadfastResult.status ===
      "fulfilled"
    ) {
      steadfast = {
        success:
          safeNumber(
            steadfastResult.value
              ?.success
          ),

        total:
          safeNumber(
            steadfastResult.value
              ?.total
          ),

        rate:
          safeNumber(
            steadfastResult.value
              ?.rate
          ),

        cancellationRate:
          safeNumber(
            steadfastResult.value
              ?.cancellationRate
          ),

        volumeBand:
          steadfastResult.value
            ?.volumeBand ||
          null,

        volumeRange:
          steadfastResult.value
            ?.volumeRange ||
          null,

        fraudReports:
          safeNumber(
            steadfastResult.value
              ?.fraudReports
          ),
      };
    } else {
      steadfast = {
        success: 0,

        total: 0,

        rate: 0,

        error:
          steadfastResult.reason
            ?.message ||
          String(
            steadfastResult.reason ||
              "Steadfast failed"
          ),
      };
    }

    // ===============================================
    // OVERALL
    // ===============================================

    const totalSuccess =
      safeNumber(
        pathao.success
      ) +
      safeNumber(
        steadfast.success
      );

    const totalOrders =
      safeNumber(
        pathao.total
      ) +
      safeNumber(
        steadfast.total
      );

    const overallRate =
      calculateRate(
        totalSuccess,
        totalOrders
      );

    // ===============================================
    // FINAL RETURN
    // ===============================================

    return {
      success: true,

      phone,

      overall: {
        success:
          totalSuccess,

        total:
          totalOrders,

        rate:
          overallRate,
      },

      pathao,

      steadfast,
    };
  } catch (error: any) {
    console.error(
      "GET CUSTOMER RATING ERROR:",
      error
    );

    return {
      success: false,

      phone,

      overall: {
        success: 0,
        total: 0,
        rate: 0,
      },

      pathao: {
        success: 0,
        total: 0,
        rate: 0,

        error:
          error?.message ||
          "Pathao failed",
      },

      steadfast: {
        success: 0,
        total: 0,
        rate: 0,

        error:
          error?.message ||
          "Steadfast failed",
      },
    };
  }
}