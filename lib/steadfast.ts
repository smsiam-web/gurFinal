// lib/steadfast.ts
export interface SteadfastCreateOrderReq {
  cod_amount: string | number;
  invoice: string;
  note?: string;
  recipient_name: string;
  recipient_phone: string;   // 01XXXXXXXXX
  recipient_address: string; // Full address line
  // প্রয়োজনে city/zone/area/weight ইত্যাদি পরে যোগ করতে পারবেন
}

export interface SteadfastCreateOrderRes {
  status?: string;
  message?: string;
  consignment?: {
    consignment_id?: string | number;
    tracking_code?: string;
  };
  [k: string]: any;
}

const BASE = process.env.STEADFAST_BASE_URL || "";
const API_KEY = process.env.STEADFAST_API_KEY || "";
const SECRET = process.env.STEADFAST_SECRET_KEY || "";

function assertEnv() {
  if (!BASE || !API_KEY || !SECRET) {
    throw new Error("Steadfast env vars missing");
  }
}

export async function sfCreateOrder(
  payload: SteadfastCreateOrderReq
): Promise<SteadfastCreateOrderRes> {
  assertEnv();

  const res = await fetch(`${BASE}/create_order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": API_KEY,       // <- কোন টাইপ নয়, কেবল ভ্যারিয়েবল
      "Secret-Key": SECRET,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as SteadfastCreateOrderRes;

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(`Steadfast error: ${msg}`);
  }
  return data;
}

export async function getSteadfastCustomerRating(
  phone: string
) {
  const sessionCookie =
    process.env.STEADFAST_SESSION_COOKIE || "";

  if (!sessionCookie) {
    throw new Error(
      "STEADFAST_SESSION_COOKIE missing"
    );
  }

  const response = await fetch(
    `https://steadfast.com.bd/user/frauds/check/${phone}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",

        "X-Requested-With":
          "XMLHttpRequest",

        Cookie:
          sessionCookie,

        Referer:
          `https://steadfast.com.bd/user/frauds/check?phone=${phone}`,

        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
      },

      redirect: "follow",
    }
  );

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  const text =
    await response.text();

  // Login page / expired session
  if (
    contentType.includes("text/html") ||
    text.includes(
      "Merchant sign-in"
    ) ||
    text.includes(
      'action="https://steadfast.com.bd/login"'
    )
  ) {
    throw new Error(
      "Steadfast session expired"
    );
  }

  let data: any;

  try {
    data =
      JSON.parse(text);
  } catch {
    throw new Error(
      "Invalid Steadfast response"
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Steadfast HTTP ${response.status}`
    );
  }

  const rate =
    Number(
      data?.delivery_ratio || 0
    );

  const cancellationRate =
    Number(
      data?.cancellation_ratio || 0
    );

  const deliveredCount =
    data?.delivered_count ?? null;

  const cancelledCount =
    data?.cancelled_count ?? null;

  return {
    success:
      deliveredCount ?? 0,

    total:
      deliveredCount !== null &&
      cancelledCount !== null
        ? Number(deliveredCount) +
          Number(cancelledCount)
        : 0,

    rate,

    cancellationRate,

    volumeBand:
      data?.volume_band || null,

    volumeRange:
      data?.volume_range || null,

    fraudReports:
      Number(
        data?.fraud_reports || 0
      ),
  };
}
